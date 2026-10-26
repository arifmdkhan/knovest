import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "@/lib/s3-client";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { Readable } from "stream";
import { pipeline } from "node:stream/promises";
import { tmpdir } from "node:os";
import { isLessonAssetKey } from "@/lib/storage/asset-keys";

if (!ffmpegPath) {
    throw new Error("FFmpeg binary not found in ffmpeg-static!");
}

export class VideoProcessor {

    /**
     * Main entry point to process a video lesson.
     * 1. Downloads raw MP4 from S3
     * 2. Transcodes to HLS (Master + 3 Qualities)
     * 3. Uploads all files to S3
     * 4. Updates Lesson Record
     */
    static async processLessonVideo(lessonId: string): Promise<void> {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId, deletedAt: null }, include: { chapter: { select: { courseId: true } } } });
        if (!lesson || !lesson.videoKey) throw new Error("Lesson or video key not found");
        if (!isLessonAssetKey(lesson.videoKey, lesson.chapter.courseId, lessonId, "video") || !lesson.videoKey.includes("/video/raw/")) throw new Error("Invalid source video");

        // Temp Check
        if (lesson.videoStatus === "READY") return;

        const leaseToken = uuidv4();
        const claim = await prisma.lesson.updateMany({
            where: { id: lessonId, videoKey: lesson.videoKey, videoAttempts: { lt: 3 }, OR: [
                { videoStatus: { in: ["UPLOADED", "FAILED"] } },
                { videoStatus: "PROCESSING", videoLeaseExpiresAt: { lt: new Date() } },
            ] },
            data: { videoStatus: "PROCESSING", videoProgress: 0, videoError: null, videoAttempts: { increment: 1 }, videoLeaseToken: leaseToken, videoLeaseExpiresAt: new Date(Date.now() + 20 * 60000) }
        });
        if (!claim.count) return;

        const workDir = fs.mkdtempSync(path.join(tmpdir(), "knovest-video-"));
        const cleanup = () => {
            const resolved = path.resolve(workDir);
            if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep) || !path.basename(resolved).startsWith("knovest-video-")) throw new Error("Invalid scratch directory");
            fs.rmSync(resolved, { recursive: true, force: true });
        };

        const rawInputPath = path.join(workDir, "input.mp4");
        const outputDir = path.join(workDir, "hls");
        const outputPrefix = `courses/${lesson.chapter.courseId}/lessons/${lessonId}/video/hls/${leaseToken}`;
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        try {
            console.log(`[VideoProcessor] Starting job for ${lessonId}`);

            // 1. Download Raw Video
            console.log(`[VideoProcessor] Downloading raw video...`);
            await this.downloadFile(lesson.videoKey, rawInputPath);

            // 2. Transcode
            console.log(`[VideoProcessor] Transcoding...`);
            await this.transcodeToHLS(rawInputPath, outputDir);

            // 3. Upload Output
            console.log(`[VideoProcessor] Uploading HLS segments...`);

            const masterKey = await this.uploadDirectory(outputDir, outputPrefix);

            // 4. Cleanup
            cleanup();

            // 5. Update DB
            await prisma.$transaction(async tx => {
                const committed = await tx.lesson.updateMany({
                    where: { id: lessonId, videoKey: lesson.videoKey, videoLeaseToken: leaseToken },
                    data: { videoStatus: "READY", videoProgress: 100, videoKey: masterKey, videoLeaseToken: null, videoLeaseExpiresAt: null },
                });
                await tx.cleanupJob.create({ data: committed.count
                    ? { entityType: "OBJECT", entityId: lesson.videoKey!, scheduledAt: new Date() }
                    : { entityType: "ASSET_PREFIX", entityId: lessonId, prefixes: [outputPrefix + "/"], scheduledAt: new Date() } });
            });

            console.log(`[VideoProcessor] Job Complete. Master: ${masterKey}`);

        } catch (error: unknown) {
            console.error("[VideoProcessor] Job Failed", error);
            await prisma.$transaction(async tx => {
              await tx.cleanupJob.create({ data: { entityType: "ASSET_PREFIX", entityId: lessonId, prefixes: [outputPrefix + "/"], scheduledAt: new Date() } });
              await tx.lesson.updateMany({
                where: { id: lessonId, videoLeaseToken: leaseToken },
                data: {
                    videoStatus: "FAILED",
                    videoError: "Video processing failed. Retry or upload a supported video.",
                    videoLeaseToken: null,
                    videoLeaseExpiresAt: new Date(Date.now() + 5 * 60000),
                }
              });
            });
            // Cleanup even on fail
            cleanup();
            throw error;
        }
    }

    private static async downloadFile(key: string, destPath: string) {
        const bucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES!;

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        const response = await s3Client.send(command);
        if (!response.Body) throw new Error("Empty body");

        const stream = response.Body as Readable;
        const fileStream = fs.createWriteStream(destPath);

        await pipeline(stream, fileStream, { signal: AbortSignal.timeout(60000) });
    }

    private static async transcodeToHLS(inputPath: string, outputDir: string): Promise<void> {
        const hasAudio = await new Promise<boolean>((resolve, reject) => {
            const probe = spawn(ffmpegPath!, ['-hide_banner', '-nostdin', '-protocol_whitelist', 'file,pipe', '-i', inputPath], { timeout: 15000, windowsHide: true });
            let details = '';
            probe.stderr.on('data', data => { details = (details + data.toString()).slice(-16384); });
            probe.once('error', reject);
            probe.once('close', () => details.includes('Video:') ? resolve(details.includes('Audio:')) : reject(new Error('Unsupported video')));
        });
        return new Promise((resolve, reject) => {
            // Construct arguments for ffmpeg
            // We need to map the fluent-ffmpeg logic to raw CLI args
            const args = [
                '-nostdin', '-protocol_whitelist', 'file,pipe', '-i', inputPath,
                ...(!hasAudio ? ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-shortest'] : []),
                '-profile:v', 'main',
                '-preset', 'veryfast',
                '-sc_threshold', '0',
                '-g', '48',
                '-keyint_min', '48',
                '-hls_time', '4',
                '-hls_playlist_type', 'vod',
                '-master_pl_name', 'master.m3u8',

                // MAP 0
                '-map', '0:v:0', '-map', hasAudio ? '0:a:0' : '1:a:0',
                // MAP 1
                '-map', '0:v:0', '-map', hasAudio ? '0:a:0' : '1:a:0',
                // MAP 2
                '-map', '0:v:0', '-map', hasAudio ? '0:a:0' : '1:a:0',

                // Stream 0: 1080p
                '-filter:v:0', "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2", '-threads:v:0', '1', '-c:v:0', 'libx264', '-b:v:0', '5000k', '-maxrate:v:0', '5350k', '-bufsize:v:0', '7500k',
                '-c:a:0', 'aac', '-b:a:0', '192k',

                // Stream 1: 720p
                '-filter:v:1', "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2", '-threads:v:1', '1', '-c:v:1', 'libx264', '-b:v:1', '2800k', '-maxrate:v:1', '2996k', '-bufsize:v:1', '4200k',
                '-c:a:1', 'aac', '-b:a:1', '128k',

                // Stream 2: 480p
                '-filter:v:2', "scale=w='min(854,iw)':h='min(480,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2", '-threads:v:2', '1', '-c:v:2', 'libx264', '-b:v:2', '1400k', '-maxrate:v:2', '1498k', '-bufsize:v:2', '2100k',
                '-c:a:2', 'aac', '-b:a:2', '96k',

                // Variant Map
                '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',

                // Output pattern
                `${outputDir}/stream_%v.m3u8`
            ];

            const ffmpegProcess = spawn(ffmpegPath!, args, { timeout: 180000, killSignal: 'SIGKILL', windowsHide: true });

    
            ffmpegProcess.stderr.on('data', (data) => {
                // ffmpeg logs to stderr by default
                void data; // Drain stderr; do not retain private input paths or unbounded logs.
            
            });

            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });

            ffmpegProcess.on('error', (err) => {
                reject(err);
            });
        });
    }

    private static async uploadDirectory(localDir: string, s3Prefix: string): Promise<string> {
        const files = fs.readdirSync(localDir);
        const bucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES!;

        for (const file of files) {
            const filePath = path.join(localDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            const s3Key = `${s3Prefix}/${file}`;

            // Determine content type
            const contentType = file.endsWith('.m3u8')
                ? 'application/vnd.apple.mpegurl'
                : 'video/MP2T';

            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: contentType
            }));
        }

        return `${s3Prefix}/master.m3u8`;
    }
}

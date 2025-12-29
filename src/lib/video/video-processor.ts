import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "@/lib/s3-client";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { Readable } from "stream";

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
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson || !lesson.videoKey) throw new Error("Lesson or video key not found");

        // Temp Check: Is it already done? (Wait, what if we want to re-process? Let's rely on caller or force flag)
        if (lesson.videoStatus === "READY") return;

        await prisma.lesson.update({
            where: { id: lessonId },
            data: { videoStatus: "PROCESSING", videoProgress: 0, videoError: null }
        });

        const workDir = path.join(process.cwd(), "tmp", "video-processing", lessonId);
        if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

        const rawInputPath = path.join(workDir, "input.mp4");
        const outputDir = path.join(workDir, "hls");
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

            const rawKeyParts = lesson.videoKey.split("/");
            let outputPrefix = `processed/${lessonId}/${uuidv4()}`;
            if (rawKeyParts.includes("courses") && rawKeyParts.includes("lessons")) {
                // reconstruct base: courses/{id}/lessons/{id}
                const lessonIdx = rawKeyParts.indexOf("lessons");
                const base = rawKeyParts.slice(0, lessonIdx + 2).join("/");
                outputPrefix = `${base}/video/hls/${uuidv4()}`;
            }

            const masterKey = await this.uploadDirectory(outputDir, outputPrefix);

            // 4. Cleanup
            fs.rmSync(workDir, { recursive: true, force: true });

            // 5. Update DB
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    videoStatus: "READY",
                    videoProgress: 100,
                    videoKey: masterKey // Update to point to master.m3u8
                }
            });

            console.log(`[VideoProcessor] Job Complete. Master: ${masterKey}`);

        } catch (error: any) {
            console.error("[VideoProcessor] Job Failed", error);
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    videoStatus: "FAILED",
                    videoError: error.message || "Unknown transcoding error"
                }
            });
            // Cleanup even on fail
            fs.rmSync(workDir, { recursive: true, force: true });
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

        return new Promise<void>((resolve, reject) => {
            stream.pipe(fileStream)
                .on("error", reject)
                .on("finish", resolve);
        });
    }

    private static async transcodeToHLS(inputPath: string, outputDir: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Construct arguments for ffmpeg
            // We need to map the fluent-ffmpeg logic to raw CLI args
            const args = [
                '-i', inputPath,
                '-profile:v', 'main',
                '-preset', 'veryfast',
                '-sc_threshold', '0',
                '-g', '48',
                '-keyint_min', '48',
                '-hls_time', '4',
                '-hls_playlist_type', 'vod',
                '-master_pl_name', 'master.m3u8',

                // MAP 0
                '-map', '0:v:0', '-map', '0:a:0',
                // MAP 1
                '-map', '0:v:0', '-map', '0:a:0',
                // MAP 2
                '-map', '0:v:0', '-map', '0:a:0',

                // Stream 0: 1080p
                '-s:v:0', '1920x1080', '-c:v:0', 'libx264', '-b:v:0', '5000k', '-maxrate:v:0', '5350k', '-bufsize:v:0', '7500k',
                '-c:a:0', 'aac', '-b:a:0', '192k',

                // Stream 1: 720p
                '-s:v:1', '1280x720', '-c:v:1', 'libx264', '-b:v:1', '2800k', '-maxrate:v:1', '2996k', '-bufsize:v:1', '4200k',
                '-c:a:1', 'aac', '-b:a:1', '128k',

                // Stream 2: 480p
                '-s:v:2', '854x480', '-c:v:2', 'libx264', '-b:v:2', '1400k', '-maxrate:v:2', '1498k', '-bufsize:v:2', '2100k',
                '-c:a:2', 'aac', '-b:a:2', '96k',

                // Variant Map
                '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',

                // Output pattern
                `${outputDir}/stream_%v.m3u8`
            ];

            console.log(`[VideoProcessor] Spawning ffmpeg: ${ffmpegPath} ${args.join(' ')}`);

            const ffmpegProcess = spawn(ffmpegPath!, args);

            // Optional: Capture logs to see progress
            ffmpegProcess.stderr.on('data', (data) => {
                // ffmpeg logs to stderr by default
                const msg = data.toString();
                // console.log(`[FFmpeg] ${msg}`); 
                // We could parse this for progress if we wanted to update DB %
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

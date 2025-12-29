import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3-client";
import { requireUser } from "@/server/data/user/require-user";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ courseId: string; lessonId: string; file: string }> }
) {
    try {
        // Await params as per Next.js 15+
        const { courseId, lessonId, file } = await params;

        // 1. Authorization
        let user;
        try {
            user = await requireUser();
        } catch (e) {
            // requireUser redirects, but in API we often want JSON/401. 
            // If it throws/redirects, we catch.
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check ownership or enrollment
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { userId: true }
        });

        if (!course) return new NextResponse("Course not found", { status: 404 });

        const isOwner = course.userId === user.id;
        let isEnrolled = false;

        if (!isOwner) {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: courseId
                    }
                }
            });
            isEnrolled = enrollment?.status === 'Active';
        }

        if (!isOwner && !isEnrolled) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // 2. Locate the file in S3
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId }
        });

        if (!lesson || !lesson.videoKey) {
            return new NextResponse("Video not found", { status: 404 });
        }

        // lesson.videoKey points to "master.m3u8"
        // We need to resolve the requested `file` relative to that directory.
        const baseDir = lesson.videoKey.substring(0, lesson.videoKey.lastIndexOf('/') + 1);
        const requestedKey = `${baseDir}${file}`;

        const bucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES!;

        if (file.endsWith('.m3u8')) {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: requestedKey
            });

            try {
                const response = await s3Client.send(command);
                const bodyStr = await response.Body?.transformToString();

                if (!bodyStr) return new NextResponse("Empty Playlist", { status: 500 });

                let modifiedM3u8 = bodyStr;

                // Rewrite segment URLs if it's a variant playlist
                if (!bodyStr.includes("#EXT-X-STREAM-INF")) {
                    const lines = bodyStr.split('\n');
                    const newLines = await Promise.all(lines.map(async (line) => {
                        if (line.trim().length === 0 || line.startsWith('#')) {
                            return line;
                        }
                        // It's a file path (segment) - Generate signed URL
                        const segmentKey = `${baseDir}${line.trim()}`;

                        const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
                            Bucket: bucket,
                            Key: segmentKey
                        }), { expiresIn: 300 });

                        return signedUrl;
                    }));
                    modifiedM3u8 = newLines.join('\n');
                }

                return new NextResponse(modifiedM3u8, {
                    headers: {
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });

            } catch (e) {
                console.error(e);
                return new NextResponse("S3 Error", { status: 500 });
            }
        } else {
            return new NextResponse("Not Found", { status: 404 });
        }

    } catch (error) {
        console.error("HLS Proxy Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VideoProcessor } from "@/lib/video/video-processor";

export const maxDuration = 300; // 5 minutes (Vercel Pro) - locally this can be longer

export async function GET(req: Request) {
    try {
        // 1. Authenticate Cron (Optional key check)
        const { searchParams } = new URL(req.url);
        const key = searchParams.get("key");
        if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Find Jobs
        // We look for lessons that are 'UPLOADED' (ready to process)
        // OR 'PROCESSING' but stuck (updatedAt < 10 mins ago?) - simple retry logic
        const lessons = await prisma.lesson.findMany({
            where: {
                videoStatus: "UPLOADED",
            },
            take: 2 // Process 2 at a time to avoid timeouts
        });

        if (lessons.length === 0) {
            return NextResponse.json({ message: "No jobs found" });
        }

        console.log(`[Cron] Found ${lessons.length} jobs`);

        // 3. Process
        const results = await Promise.allSettled(
            lessons.map(async (lesson) => {
                await VideoProcessor.processLessonVideo(lesson.id);
                return lesson.id;
            })
        );

        return NextResponse.json({
            success: true,
            processed: results.length,
            details: results
        });

    } catch (error: any) {
        console.error("Cron Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VideoProcessor } from "@/lib/video/video-processor";
export const maxDuration = 300;
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET) return new NextResponse("Unauthorized", { status: 401 });
  if (process.env.NODE_ENV === "production" && process.env.VIDEO_PROCESSING_ENABLED !== "true") return NextResponse.json({ error: "Enable processing only on a verified Node/FFmpeg host" }, { status: 503 });
  try {
    const now = new Date();
    const lessons = await prisma.lesson.findMany({ where: { deletedAt: null, videoAttempts: { lt: 3 }, OR: [
      { videoStatus: "UPLOADED" },
      { videoStatus: "FAILED", videoLeaseExpiresAt: { lte: now } },
      { videoStatus: "PROCESSING", videoLeaseExpiresAt: { lt: now } },
    ] }, orderBy: { updatedAt: "asc" }, take: 1 });
    for (const lesson of lessons) await VideoProcessor.processLessonVideo(lesson.id);
    return NextResponse.json({ processed: lessons.length }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Processing failed; retry policy applies" }, { status: 503 }); }
}

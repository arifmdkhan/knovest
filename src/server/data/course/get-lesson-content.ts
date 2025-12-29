import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StorageService } from "@/lib/storage/storage-service";

export async function getLessonContent(lessonId: string) {
  const user = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      videoStatus: true,
      position: true,
      resources: true,
      chapter: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: lesson.chapter.courseId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return notFound();
  }

  const progress = await prisma.enrolledCourseProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      },
    },
  });

  let videoUrl: string | undefined;
  if (lesson.videoKey) {
    if (lesson.videoStatus === "READY") {
      // Use HLS Proxy URL
      // /api/courses/[courseId]/lessons/[lessonId]/hls/master.m3u8
      videoUrl = `/api/courses/${lesson.chapter.courseId}/lessons/${lesson.id}/hls/master.m3u8`;
    } else {
      // Fallback to raw signed URL (if allowed) or leave undefined if processing
      // For now, let's allow raw playback if not processed yet (e.g. for preview or legacy)
      // BUT if it's "PROCESSING", maybe we should just wait.
      // Let's fallback to S3 signed URL for "UPLOADED" or "FAILED" (if raw key exists) so it's not broken.
      videoUrl = await StorageService.getPlaybackUrl(lesson.videoKey);
    }
  }

  const resources = await Promise.all(
    lesson.resources.map(async (r) => ({
      ...r,
      url: await StorageService.getPlaybackUrl(r.url),
    }))
  );

  return {
    ...lesson,
    videoUrl, // Pass signed URL
    resources,
    isCompleted: progress?.isCompleted ?? false,
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;

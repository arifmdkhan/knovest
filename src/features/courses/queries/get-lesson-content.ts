import "server-only";
import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StorageService } from "@/lib/storage/storage-service";
import { isLessonAssetKey } from "@/lib/storage/asset-keys";

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
  if (lesson.videoKey && isLessonAssetKey(lesson.videoKey, lesson.chapter.courseId, lessonId, "video")) {
    if (lesson.videoStatus === "READY") {
      // Use HLS Proxy URL
      // /api/courses/[courseId]/lessons/[lessonId]/hls/master.m3u8
      videoUrl = `/api/courses/${lesson.chapter.courseId}/lessons/${lesson.id}/hls/master.m3u8`;
    } else {
     
    
      videoUrl = await StorageService.getPlaybackUrl(lesson.videoKey);
    }
  }

  const resources = lesson.resources.map((r) => ({
    id: r.id,
    name: r.name,
    url: "", 
  }));

  return {
    ...lesson,
    videoUrl,
    resources,
    isCompleted: progress?.isCompleted ?? false,
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;

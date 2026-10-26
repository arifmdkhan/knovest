"use server";

import { requireCreator } from "@/features/creator/queries/require-creator";
import { prisma } from "@/lib/db";
import { lessonSchema } from "@/features/courses/schemas";
import { lessonSchemaType } from "@/features/courses/schemas";

import { ApiResponse } from "@/types/api";
import { isLessonAssetKey } from "@/lib/storage/asset-keys";

export async function updateLesson(
  values: lessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  const session = await requireCreator();
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const owner = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null, chapter: { course: { userId: session.user.id, deletedAt: null } } },
      select: { chapter: { select: { courseId: true } } },
    });
    if (!owner) return { status: "error", message: "Lesson unavailable" };
    const courseId = owner.chapter.courseId;
    if ((result.data.videoKey && !isLessonAssetKey(result.data.videoKey, courseId, lessonId, "video")) ||
        (result.data.thumbnailKey && !isLessonAssetKey(result.data.thumbnailKey, courseId, lessonId, "thumbnail")) ||
        result.data.resources?.some(item => !isLessonAssetKey(item.url, courseId, lessonId, "resources"))) {
      return { status: "error", message: "Upload each asset to this lesson before attaching it" };
    }
    await prisma.$transaction(async (tx) => {
      await tx.lesson.update({
        where: {
          id: lessonId,
          chapter: { course: { userId: session.user.id, deletedAt: null } },
        },
        data: {
          title: result.data.name,
          description: result.data.description,
          thumbnailKey: result.data.thumbnailKey,
          videoKey: result.data.videoKey,
        },
      });

      if (result.data.resources) {
        await tx.lessonResource.deleteMany({
          where: {
            lessonId,
          },
        });

        if (result.data.resources.length > 0) {
          await tx.lessonResource.createMany({
            data: result.data.resources.map((r) => ({
              name: r.name,
              url: r.url,
              lessonId,
            })),
          });
        }
      }
    });

    return {
      status: "success",
      message: "Lesson Updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update Lesson",
    };
  }
}

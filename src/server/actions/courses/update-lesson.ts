"use server";

import { requireCreator } from "@/server/data/creator/require-creator";
import { prisma } from "@/lib/db";
import { lessonSchema, lessonSchemaType } from "@/lib/schema/zod-schema";

import { ApiResponse } from "@/types/api";

export async function updateLesson(
  values: lessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  await requireCreator();
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.lesson.update({
        where: {
          id: lessonId,
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

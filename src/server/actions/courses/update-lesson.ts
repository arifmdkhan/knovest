"use server";

import { requireCreator } from "@/app/data/creator/require-creator";
import { prisma } from "@/lib/db";
import { lessonSchema, lessonSchemaType } from "@/lib/schema/zod-schema";

import { ApiResponse } from "@/lib/types";

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

    await prisma.lesson.update({
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

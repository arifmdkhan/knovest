"use server";

import { requireCreator } from "@/features/creator/queries/require-creator";
import { prisma } from "@/lib/db";
import { courseSchema, CourseSchemaType } from "@/features/courses/schemas";
import { ApiResponse } from "@/types/api";

export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  const session = await requireCreator();

  try {

    const validation = courseSchema.safeParse(values);
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const existingCourse = await prisma.course.findUnique({
      where: {
        slug: validation.data.slug,
      },
    });

    if (existingCourse) {
      return {
        status: "error",
        message: "Slug already exists. Please choose a different one.",
      };
    }

    await prisma.course.create({
      data: {
        ...validation.data,
        id: validation.data.id || undefined,
        userId: session.user.id as string,
      },
    });
    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}

"use server";

import { requireCreator } from "@/features/creator/queries/require-creator";
import { ApiResponse } from "@/types/api";
import { chapterSchema, chapterSchemaType, lessonSchema, lessonSchemaType } from "@/features/courses/schemas";
import { courseSchema, CourseSchemaType } from "@/features/courses/schemas";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

async function ownsCourse(courseId: string, userId: string) {
  return !!await prisma.course.findFirst({
    where: { id: courseId, userId, deletedAt: null },
    select: { id: true },
  });
}

export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const user = await requireCreator();

  try {

    const result = courseSchema.safeParse(data);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    if (result.data.id && result.data.id !== courseId) return { status: "error", message: "Course identity cannot be changed" };

    const existingCourse = await prisma.course.findFirst({
      where: {
        slug: result.data.slug,
        id: {
          not: courseId,
        },
      },
    });

    if (existingCourse) {
      return {
        status: "error",
        message: "Slug already exists. Please choose a different one.",
      };
    }

    await prisma.course.update({
      where: {
        id: courseId,
        userId: user.user.id,
      },
      data: {
        ...result.data,
      },
    });

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update course",
    };
  }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  const session = await requireCreator();
  try {
    if (!await ownsCourse(courseId, session.user.id)) return { status: "error", message: "Course not found or access denied" };
    if (!await prisma.chapter.findFirst({ where: { id: chapterId, courseId }, select: { id: true } })) return { status: "error", message: "Chapter not found" };
    if (!lessons || lessons.length === 0 || lessons.length > 500 || lessons.some(item => !Number.isInteger(item.position) || item.position < 0)) {
      return {
        status: "error",
        message: "No lessons present",
      };
    }
    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: {
          id: lesson.id,
          chapterId: chapterId,
        },
        data: {
          position: lesson.position,
        },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/academy/creator/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder lessons",
    };
  }
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  const session = await requireCreator();
  try {
    if (!await ownsCourse(courseId, session.user.id)) return { status: "error", message: "Course not found or access denied" };
    if (!chapters || chapters.length === 0 || chapters.length > 500 || chapters.some(item => !Number.isInteger(item.position) || item.position < 0)) {
      return {
        status: "error",
        message: "No chapter found for reordering",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          courseId: courseId,
        },
        data: {
          position: chapter.position,
        },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/academy/creator/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

export async function createChapter(
  values: chapterSchemaType
): Promise<ApiResponse> {
  const session = await requireCreator();
  try {
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    if (!await ownsCourse(result.data.courseId, session.user.id)) return { status: "error", message: "Course not found or access denied" };

    await prisma.$transaction(async (tx) => {
      const maxPosition = await tx.chapter.findFirst({
        where: {
          courseId: result.data.courseId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });
      await tx.chapter.create({
        data: {
          title: result.data.name,
          courseId: result.data.courseId,
          position: (maxPosition?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/academy/creator/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

export async function createLesson(
  values: lessonSchemaType
): Promise<ApiResponse> {
  const session = await requireCreator();
  try {
    const result = lessonSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    const chapter = await prisma.chapter.findFirst({
      where: { id: result.data.chapterId, courseId: result.data.courseId, course: { userId: session.user.id, deletedAt: null } },
      select: { id: true },
    });
    if (!chapter) return { status: "error", message: "Chapter not found or access denied" };

    // A new lesson has no existing asset namespace. Attach uploads only after creation.
    if (result.data.videoKey || result.data.thumbnailKey || result.data.resources?.length) return { status: "error", message: "Create the lesson before uploading assets" };

    await prisma.$transaction(async (tx) => {
      const maxPosition = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });
      await tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          chapterId: result.data.chapterId,
          position: (maxPosition?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/academy/creator/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create Lesson",
    };
  }
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  const session = await requireCreator();

  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId,
        course: { userId: session.user.id, deletedAt: null },
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "chapter not found",
      };
    }

    const lessons = chapterWithLessons.lessons;
    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);
    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.cleanupJob.create({ data: { entityType: "ASSET_PREFIX", entityId: lessonId, scheduledAt: new Date(), prefixes: [`courses/${courseId}/lessons/${lessonId}/`] } }),
      prisma.lesson.delete({
        where: { id: lessonId, chapterId: chapterId },
      }),
    ]);
    revalidatePath(`/academy/creator/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted successfully",
    };
  } catch (error) {
    console.error("Delete Lesson Error:", error);
    return {
      status: "error",
      message: "Failed to delete Lesson",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  const session = await requireCreator();

  try {
    const courseWithChapters = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id,
        deletedAt: null,
      },
      select: {
        chapter: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
            lessons: { select: { id: true } },
          },
        },
      },
    });

    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const chapters = courseWithChapters.chapter;
    const chapterToDelete = chapters.find(
      (chapter) => chapter.id === chapterId
    );

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "chapter not found in the course",
      };
    }

    const remainingChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId
    );
    const updates = remainingChapters.map((chapter, index) => {
      return prisma.chapter.update({
        where: { id: chapter.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      ...(chapterToDelete.lessons.length ? [prisma.cleanupJob.create({ data: { entityType: "ASSET_PREFIX", entityId: chapterId, scheduledAt: new Date(), prefixes: chapterToDelete.lessons.map(lesson => `courses/${courseId}/lessons/${lesson.id}/`) } })] : []),
      prisma.chapter.delete({
        where: { id: chapterId },
      }),
    ]);
    revalidatePath(`/academy/creator/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted successfully",
    };
  } catch (error) {
    console.error("Delete Chapter Error:", error);
    return {
      status: "error",
      message: "Failed to delete Chapter",
    };
  }
}


import { prisma } from "@/lib/db";
import "server-only";
import type { courseLevels } from "../schemas";


export async function getAllCourses(authorId?: string, category?: string, userId?: string, options: { query?: string; level?: typeof courseLevels[number]; sort?: string } = {}) {
  const data = await prisma.course.findMany({
    take: 100,
    where: {
      status: "Published",
      deletedAt: null,
      ...(authorId && { userId: authorId }),
      ...(category && { category: category }),
      ...(options.level && { level: options.level }),
      ...(options.query?.trim() && { title: { contains: options.query.trim().slice(0, 200), mode: "insensitive" as const } }),
    },
    orderBy: options.sort === "price" ? [{ price: "asc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      price: true,
      offerPrice: true,
      level: true,
      fileKey: true,
      slug: true,
      category: true,
      user: {
        select: {
          name: true,
          username: true,
          image: true,
          expertVerificationType: true,
          accountVerificationType: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      enrollment: userId ? {
        where: {
          userId: userId,
          status: 'Active'
        },
        select: {
          id: true,
          status: true
        }
      } : false,
      savedBy: userId ? {
        where: { userId },
        select: { id: true }
      } : false,
    },
  });

  // Transform data to ensure type safety and cleaner object
  return data.map(course => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { savedBy, ...rest } = course;
    return {
      ...rest,
      isSaved: course.savedBy ? course.savedBy.length > 0 : false,
    };
  });
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];

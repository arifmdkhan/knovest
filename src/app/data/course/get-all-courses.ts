
import { prisma } from "@/lib/db";
import "server-only";


export async function getAllCourses(authorId?: string, category?: string) {
  //   await new Promise((resolve) => setTimeout(resolve, 5000));
  const data = await prisma.course.findMany({
    where: {
      status: "Published",
      ...(authorId && { userId: authorId }),
      ...(category && { category: category }),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      price: true,
      level: true,
      fileKey: true,
      slug: true,
      category: true,
      user: {
        select: {
          name: true,
          username: true,
          image: true,
          isVerified: true,
          isSebiVerified: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });
  return data;
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];

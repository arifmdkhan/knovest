import "server-only";
import { requireCreator } from "./require-creator";
import { prisma } from "@/lib/db";

export async function creatorGetCourses() {
  const session = await requireCreator();
  const data = await prisma.course.findMany({
    where: {
      userId: session.user.id,
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
      offerPrice: true,
      level: true,
      status: true,
      fileKey: true,
      slug: true,
      user: {
        select: {
          name: true,
          username: true,
          image: true,
          expertVerificationType: true,
          accountVerificationType: true,
        }
      }
    },
  });
  return data;
}

export type CreatorGetCourseType = Awaited<
  ReturnType<typeof creatorGetCourses>>[0];

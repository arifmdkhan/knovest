import "server-only";
import { requireCreator } from "./require-creator";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export async function creatorGetCourse(courseId: string) {
  await requireCreator();

  const data = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      duration: true,
      price: true,
      offerPrice: true,
      level: true,
      status: true,
      slug: true,
      smallDescription: true,
      category: true,
      chapter: {
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailKey: true,
              position: true,
              videoKey: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type CreatorCourseSingularType = Awaited<
  ReturnType<typeof creatorGetCourse>
>;

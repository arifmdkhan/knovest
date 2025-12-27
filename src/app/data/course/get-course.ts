import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getIndividualCourse(slug: string) {
  const course = await prisma.course.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      fileKey: true,
      price: true,
      offerPrice: true,
      duration: true,
      level: true,
      smallDescription: true,
      category: true,
      slug: true,
      chapter: {
        select: {
          id: true,
          title: true,
          lessons: {
            select: {
              id: true,
              title: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      user: {
        select: {
          name: true,
          username: true,
          image: true,
          expertVerificationType: true,
          accountVerificationType: true,
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  return course;
}

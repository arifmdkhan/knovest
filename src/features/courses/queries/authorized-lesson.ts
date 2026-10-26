import "server-only";
import { prisma } from "@/lib/db";

export function getAuthorizedLesson(courseId: string, lessonId: string, userId: string) {
  return prisma.lesson.findFirst({
    where: {
      id: lessonId, deletedAt: null,
      chapter: { courseId, course: { deletedAt: null, OR: [
        { userId },
        { status: "Published", enrollment: { some: { userId, status: "Active" } } },
      ] } },
    },
    select: { id: true, videoKey: true, videoStatus: true },
  });
}

import "server-only";


import { requireCreator } from "./require-creator";
import { prisma } from "@/lib/db";

export async function creatorGetDashboardStats() {
  const session = await requireCreator();
  const user = session.user;

  const [totalSubscriptions, totalEnrollments, totalCourses] =
    await Promise.all([
      // Total Subscriptions (users subscribed to this creator)
      prisma.subscription.count({
        where: {
          subscribedToId: user.id,
          status: "ACTIVE",
        },
      }),

      // Total Enrollments (users enrolled in courses created by this creator)
      prisma.enrollment.count({
        where: {
          course: {
            userId: user.id,
          },
          status: "Active",
        },
      }),

      // Total Courses created by this creator
      prisma.course.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

  return { totalSubscriptions, totalEnrollments, totalCourses };
}

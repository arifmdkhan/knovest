"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";

export async function enrollCourse(
  courseId: string
): Promise<ApiResponse<{ checkoutUrl: string }>> {
  const user = await requireUser();

  try {

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, price: true, offerPrice: true, userId: true, status: true, deletedAt: true },
    });

    if (!course || course.deletedAt || course.status !== "Published") {
      return { status: "error", message: "Course not found" };
    }

    if ((course.offerPrice ?? course.price) > 0) {
      return { status: "error", message: "Payments are not available yet. Please try again later." };
    }

    if (course.userId === user.id) {
      return {
        status: "error",
        message: "You cannot enroll in your own course",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });

      if (existingEnrollment?.status === "Active") {
        return {
          status: "error",
          message: "You are already enrolled in this course",
        };
      }

      let enrollmentId = existingEnrollment?.id;

      if (existingEnrollment) {
        await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "Pending", updatedAt: new Date() },
        });
      } else {
        const newEnrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.offerPrice ?? course.price,
            status: "Pending",
          },
        });
        enrollmentId = newEnrollment.id;
      }

      return { checkoutUrl: `/academy/payment?enrollmentId=${enrollmentId}` };
    });

    if ("status" in result && result.status === "error") {
      return result as ApiResponse<{ checkoutUrl: string }>;
    }

    return {
      status: "success",
      message: "Redirecting to payment...",
      data: { checkoutUrl: result.checkoutUrl as string },
    };
  } catch (error) {
    console.error("Enroll Action Error:", error);
    return { status: "error", message: "Failed to initiate enrollment" };
  }
}

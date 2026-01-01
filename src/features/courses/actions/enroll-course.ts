"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 8,
  })
);

export async function enrollCourse(
  courseId: string
): Promise<ApiResponse<{ checkoutUrl: string }>> {
  const user = await requireUser();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Too many requests. Please try again later.",
        };
      } else {
        return {
          status: "error",
          message:
            "You are a bot! If this is a mistake, please contact support.",
        };
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, price: true, userId: true },
    });

    if (!course) {
      return { status: "error", message: "Course not found" };
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
            amount: course.price,
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

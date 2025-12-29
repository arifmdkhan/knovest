"use server";

import { requireUser } from "@/server/data/user/require-user";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";

import { ApiResponse } from "@/types/api";
import { request } from "@arcjet/next";
import { redirect } from "next/navigation";

const aj = arcjet
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 8,
    })
  );

export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse | never> {
  const user = await requireUser();
  let checkoutUrl: string | undefined;

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
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "course not found",
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
        select: {
          status: true,
          id: true,
        },
      });

      if (existingEnrollment?.status === "Active") {
        return {
          status: "success" as const,
          message: "You are already enrolled in this course",
        };
      }
      let enrollment;
      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: course.price,
            status: "Pending",
            updatedAt: new Date(),
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.price,
            status: "Pending",
          },
        });
      }

      const checkOutPaymentUrl = "/academy/course/payment";

      return {
        enrollment: enrollment,
        checkoutUrl: checkOutPaymentUrl,
      };
    });

    if ("status" in result && result.status === "success") {
      return result;
    }

    checkoutUrl = (result as any).checkoutUrl;
  } catch (error) {
    console.error("Enroll in Course Action Error:", error);
    return {
      status: "error",
      message: "Failed to enroll in course",
    };
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  } else {
    return { status: "error", message: "Failed to generate checkout URL" };
  }
}

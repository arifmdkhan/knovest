"use server";

import { requireCreator } from "@/server/data/creator/require-creator";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { courseSchema, CourseSchemaType } from "@/lib/schema/zod-schema";
import { ApiResponse } from "@/types/api";

import { request } from "@arcjet/next";

const aj = arcjet
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 8,
    })
  );

export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  const session = await requireCreator();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
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

    const validation = courseSchema.safeParse(values);
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const data = await prisma.course.create({
      data: {
        ...validation.data,
        id: validation.data.id || undefined,
        userId: session.user.id as string,
      },
    });
    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}

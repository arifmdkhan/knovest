"use server";

import { requireCreator } from "@/app/data/creator/require-creator";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";

import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { deleteMediaAction } from "@/server/actions/delete-media.actions";

const aj = arcjet

  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 8,
    })
  );

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
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






    // 1. Fetch Course with Lessons to get keys
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapter: {
          include: {
            lessons: true
          }
        }
      }
    });

    if (!course) {
      return { status: "error", message: "Course not found" };
    }

    // Verify ownership? requireCreator() ensures user is creator? 
    // requireCreator just ensures ability to *be* a creator. 
    // We should check course.userId === session.user.id.
    if (course.userId !== session.user.id) {
      return { status: "error", message: "Unauthorized" };
    }

    // 2. Soft Delete in DB
    await prisma.course.update({
      where: { id: courseId },
      data: {
        deletedAt: new Date(),
      }
    });

    // 3. Immediate S3 Cleanup
    const keysToDelete: string[] = [];
    if (course.fileKey) keysToDelete.push(course.fileKey);

    if (course.chapter) {
      course.chapter.forEach(ch => {
        if (ch.lessons) {
          ch.lessons.forEach(l => {
            if (l.thumbnailKey) keysToDelete.push(l.thumbnailKey);
            if (l.videoKey) keysToDelete.push(l.videoKey);
          });
        }
      });
    }

    if (keysToDelete.length > 0) {
      console.log(`[deleteCourse] Deleting ${keysToDelete.length} keys from S3`);
      // We do this concurrently
      await Promise.all(
        keysToDelete.map(key => {
          let cleanKey = key;
          if (cleanKey.startsWith("http")) {
            try {
              cleanKey = new URL(cleanKey).pathname.slice(1);
            } catch (e) { /* ignore */ }
          }
          return deleteMediaAction(cleanKey).catch((e: any) => console.error("S3 Delete failed", e));
        })
      );
    }

    revalidatePath("/academy/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete course",
    };
  }
}

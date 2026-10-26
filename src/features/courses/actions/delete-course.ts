"use server";
import { prisma } from "@/lib/db";
import { requireCreator } from "@/features/creator/queries/require-creator";
import { enqueueCleanup } from "@/lib/storage/cleanup-jobs";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types/api";
export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireCreator();
  try {
    await prisma.$transaction(async tx => {
      await tx.course.update({ where: { id: courseId, userId: session.user.id, deletedAt: null }, data: { deletedAt: new Date() } });
      await enqueueCleanup(tx, "COURSE", courseId, ["courses/" + courseId + "/"]);
    });
    revalidatePath("/academy"); revalidatePath("/academy/creator");
    return { status: "success", message: "Course deleted; media cleanup queued" };
  } catch { return { status: "error", message: "Could not delete course" }; }
}

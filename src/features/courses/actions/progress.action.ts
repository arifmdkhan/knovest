"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";

export async function toggleLessonCompletion(lessonId: string, isCompleted: boolean): Promise<ApiResponse> {
    const user = await requireUser();

    try {
        if (isCompleted) {
            await prisma.enrolledCourseProgress.upsert({
                where: {
                    userId_lessonId: {
                        userId: user.id,
                        lessonId: lessonId,
                    },
                },
                update: {
                    isCompleted: true,
                },
                create: {
                    userId: user.id,
                    lessonId: lessonId,
                    isCompleted: true,
                },
            });
        } else {
            await prisma.enrolledCourseProgress.update({
                where: {
                    userId_lessonId: {
                        userId: user.id,
                        lessonId: lessonId,
                    },
                },
                data: {
                    isCompleted: false,
                },
            });
        }

        revalidatePath("/academy/enrolled/[slug]");
        return { status: "success", message: "Progress updated successfully" };
    } catch (error) {
        console.error("Error toggling lesson completion:", error);
        return { status: "error", message: "Failed to update progress" };
    }
}

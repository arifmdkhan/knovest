"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleLessonCompletion(lessonId: string, isCompleted: boolean) {
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
        return { success: true };
    } catch (error) {
        console.error("Error toggling lesson completion:", error);
        return { success: false, error: "Failed to update progress" };
    }
}

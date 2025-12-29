"use server";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { toggleSaveCourseSchema, ToggleSaveCourseSchemaType } from "@/lib/schema/zod-schema";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";

export async function toggleSaveCourse(data: ToggleSaveCourseSchemaType): Promise<ApiResponse<{ saved: boolean }>> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };

        const parsed = toggleSaveCourseSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: "Invalid data" };

        const { courseId } = parsed.data;
        const userId = session.user.id;

        const existingSave = await prisma.savedCourse.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });

        let saved = false;

        if (existingSave) {
            await prisma.savedCourse.delete({
                where: {
                    userId_courseId: {
                        userId,
                        courseId,
                    },
                },
            });
            saved = false;
        } else {
            await prisma.savedCourse.create({
                data: {
                    userId,
                    courseId,
                },
            });
            saved = true;
        }

        revalidatePath("/academy");

        return {
            status: "success",
            message: saved ? "Course saved" : "Course removed from saved",
            data: { saved }
        };

    } catch (error) {
        console.error("Toggle Save Course Error:", error);
        return { status: "error", message: "Failed to update course bookmark" };
    }
}

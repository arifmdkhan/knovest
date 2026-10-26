"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage-service";
import { ApiResponse } from "@/types/api";
import { isLessonAssetKey } from "@/lib/storage/asset-keys";

export async function getSecureResourceUrl(resourceId: string): Promise<ApiResponse<{ url: string }>> {
    try {
        const user = await requireUser();

        // 1. Fetch resource and related course info
        const resource = await prisma.lessonResource.findUnique({
            where: { id: resourceId },
            include: {
                lesson: {
                    include: {
                        chapter: {
                            select: { courseId: true }
                        }
                    }
                }
            }
        });

        if (!resource) {
            return { status: "error", message: "Resource not found" };
        }

        const courseId = resource.lesson.chapter.courseId;
        if (!isLessonAssetKey(resource.url, courseId, resource.lessonId, "resources")) {
            return { status: "error", message: "Resource unavailable" };
        }

        // 2. Check Enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId
                }
            }
        });

        if (!enrollment || enrollment.status !== "Active") {
         
            // check course owner.
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { userId: true }
            });

            if (course?.userId !== user.id) {
                return { status: "error", message: "Unauthorized access" };
            }
        }

        // 3. Generate Signed URL
        // Expiry: 15 minutes (900 seconds)
        const url = await StorageService.getPresignedDownloadUrl(resource.url, 900);

        return { status: "success", message: "Secure URL generated successfully", data: { url } };

    } catch (error) {
        console.error("Error generating secure resource URL:", error);
        return { status: "error", message: "Failed to generate download link" };
    }
}

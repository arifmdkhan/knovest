"use server";

import { z } from "zod";
import { StorageService } from "@/lib/storage/storage-service";
import { UploadIntent, UPLOAD_CONFIGS } from "@/lib/storage/types";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { safeAction } from "@/lib/safe-action";
import { enforceUploadQuota } from "@/lib/rate-limit";


const InitiateMultipartSchema = z.object({
    lessonId: z.string().min(1),
    fileName: z.string().min(1),
    contentType: z.string().refine((value): boolean => value === "video/mp4" || value === "video/quicktime"),
    size: z.number().int().positive().max(UPLOAD_CONFIGS[UploadIntent.COURSE_LESSON_VIDEO].maxSize),
});

const GetMultipartUrlsSchema = z.object({
    lessonId: z.string().min(1),
    uploadId: z.string().min(1),
    key: z.string().min(1),
    partNumbers: z.array(z.number().int().positive().max(10000)).min(1).max(100),
});

const CompleteMultipartSchema = z.object({
    lessonId: z.string().min(1),
    uploadId: z.string().min(1),
    key: z.string().min(1),
    parts: z.array(z.object({
        ETag: z.string().min(1),
        PartNumber: z.number().int().positive().max(10000),
    })).min(1).max(10000),
});

export const abortMultipartUploadAction = safeAction(
    GetMultipartUrlsSchema.omit({ partNumbers: true }),
    async ({ lessonId, uploadId, key }, { user }) => {
        const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, videoKey: key, chapter: { course: { userId: user!.id, deletedAt: null } } }, select: { id: true } });
        if (!lesson) return { status: "error", message: "Upload not found" };
        await StorageService.abortMultipartUpload(key, uploadId);
        await prisma.lesson.updateMany({ where: { id: lessonId, videoKey: key, videoStatus: "WAITING_UPLOAD" }, data: { videoKey: null, videoStatus: "WAITING_UPLOAD" } });
        return { status: "success", message: "Upload cancelled" };
    },
    { requiredRole: "USER" }
);



/**
 * Step 1: Initiate Multipart Upload
 * Verifies lesson ownership, sets status to WAITING_UPLOAD, creates S3 Multipart Upload.
 */
export const initiateMultipartUploadAction = safeAction(
    InitiateMultipartSchema,
    async ({ lessonId, contentType, fileName }, { user }) => {
        if (process.env.NODE_ENV === "production" && process.env.VIDEO_PROCESSING_ENABLED !== "true") return { status: "error", message: "Lesson video uploads are unavailable until video processing is enabled" };
        // 1. Verify Ownership & Lesson Existence
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { chapter: { include: { course: true } } }
        });

        if (!lesson) return { status: "error", message: "Lesson not found" };
        if (lesson.chapter.course.userId !== user!.id) {
            return { status: "error", message: "You do not own this course" };
        }

        try {
            await enforceUploadQuota(user!.id, UPLOAD_CONFIGS[UploadIntent.COURSE_LESSON_VIDEO].maxSize);
            // 2. Initiate S3 Multipart
            // Note: We use COURSE_LESSON_VIDEO intent which maps to PRIVATE bucket
            const { uploadId, key } = await StorageService.createMultipartUpload(
                UploadIntent.COURSE_LESSON_VIDEO,
                { courseId: lesson.chapter.courseId, lessonId: lesson.id },
                contentType
            );

            // 3. Update Lesson State
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    videoStatus: "WAITING_UPLOAD",
                    videoProgress: 0,
                    videoError: null,
                    videoKey: key,
                    videoAttempts: 0,
                    videoLeaseToken: null,
                    videoLeaseExpiresAt: null,
                }
            });

            return { status: "success", message: "Upload initiated", data: { uploadId, key } };

        } catch (error: any) {
            console.error("Init Upload Error:", error);
            const message = error.message || "Failed to initiate upload";
            return { status: "error", message };
        }
    },
    { requiredRole: "USER" }
);

/**
 *  Get Presigned URLs for Parts
 * Client calls this in batches to get URLs for uploading chunks.
 */
export const getMultipartUploadUrlsAction = safeAction(
    GetMultipartUrlsSchema,
    async ({ lessonId, uploadId, key, partNumbers }, { user }) => {
        if (process.env.NODE_ENV === "production" && process.env.VIDEO_PROCESSING_ENABLED !== "true") return { status: "error", message: "Video processing is unavailable. Cancel this upload and try again later." };
     

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { chapter: { include: { course: true } } }
        });

        if (!lesson) return { status: "error", message: "Lesson not found" };
        if (lesson.chapter.course.userId !== user!.id) {
            return { status: "error", message: "Unauthorized" };
        }

        if (lesson.videoKey !== key) {
            return { status: "error", message: "Invalid upload session for this lesson" };
        }

        try {
            const urls = await Promise.all(
                partNumbers.map(async (partNumber) => {
                    const url = await StorageService.getPresignedPartUrl(
                        UploadIntent.COURSE_LESSON_VIDEO,
                        key,
                        uploadId,
                        partNumber
                    );
                    return { partNumber, url };
                })
            );

            return { status: "success", message: "URLs generated", data: { parts: urls } };
        } catch (error: any) {
            console.error("Get Part URLs Error:", error);
            const message = error.message || "Failed to generate upload URLs";
            return { status: "error", message };
        }
    },
    { requiredRole: "USER" }
);

/**
 *  Complete Multipart Upload
 * Finalizes the upload and triggers processing.
 */
export const completeMultipartUploadAction = safeAction(
    CompleteMultipartSchema,
    async ({ lessonId, uploadId, key, parts }, { user }) => {
        if (process.env.NODE_ENV === "production" && process.env.VIDEO_PROCESSING_ENABLED !== "true") return { status: "error", message: "Video processing is unavailable. Cancel this upload and try again later." };
        // Security Check
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { chapter: { include: { course: true } } }
        });

        if (!lesson) return { status: "error", message: "Lesson not found" };
        if (lesson.chapter.course.userId !== user!.id) {
            return { status: "error", message: "Unauthorized" };
        }

        // Verify Key Match
        if (lesson.videoKey !== key) {
            return { status: "error", message: "Invalid upload session" };
        }

        try {
            // 1. Complete S3 Upload
            await StorageService.completeMultipartUpload(
                UploadIntent.COURSE_LESSON_VIDEO,
                key,
                uploadId,
                parts
            );

            // 2. Update Lesson State
            await prisma.lesson.update({
                where: { id: lessonId },
                data: {
                    videoStatus: "UPLOADED", // Ready for processing queue
                    videoProgress: 0,
                }
            });

            // 3. Trigger Processing 

            revalidatePath(`/academy/creator/courses`);
            return { status: "success", message: "Upload completed" };

        } catch (error: any) {
            console.error("Complete Upload Error:", error);
            const message = error.message || "Failed to complete upload";
            return { status: "error", message };
        }
    },
    { requiredRole: "USER" }
);

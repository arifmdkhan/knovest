"use server";

import { z } from "zod";
import { StorageService } from "@/lib/storage/storage-service";
import { UploadIntent } from "@/lib/storage/types";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { safeAction } from "@/lib/safe-action";

// --- Schemas ---

const InitiateMultipartSchema = z.object({
    lessonId: z.string().min(1),
    fileName: z.string().min(1),
    contentType: z.string(),
    size: z.number().int().positive(),
});

const GetMultipartUrlsSchema = z.object({
    lessonId: z.string().min(1),
    uploadId: z.string().min(1),
    key: z.string().min(1),
    partNumbers: z.array(z.number().int().positive()).min(1),
});

const CompleteMultipartSchema = z.object({
    lessonId: z.string().min(1),
    uploadId: z.string().min(1),
    key: z.string().min(1),
    parts: z.array(z.object({
        ETag: z.string().min(1),
        PartNumber: z.number().int().positive(),
    })).min(1),
});

// --- Actions ---

/**
 * Step 1: Initiate Multipart Upload
 * Verifies lesson ownership, sets status to WAITING_UPLOAD, creates S3 Multipart Upload.
 */
export const initiateMultipartUploadAction = safeAction(
    InitiateMultipartSchema,
    async ({ lessonId, contentType, fileName }, { user }) => {
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
 * Step 2: Get Presigned URLs for Parts
 * Client calls this in batches to get URLs for uploading chunks.
 */
export const getMultipartUploadUrlsAction = safeAction(
    GetMultipartUrlsSchema,
    async ({ lessonId, uploadId, key, partNumbers }, { user }) => {
        // Security Check: Verify User Owns Lesson related to this Upload
        // Just checking lessonId ownership is enough if we trust the client to pass the correct lessonId
        // But client could pass THEIR lessonId and YOUR uploadId/key.
        // Can we verify uploadId/key belongs to lessonId?
        // We stored `videoKey` in lesson.

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { chapter: { include: { course: true } } }
        });

        if (!lesson) return { status: "error", message: "Lesson not found" };
        if (lesson.chapter.course.userId !== user!.id) {
            return { status: "error", message: "Unauthorized" };
        }

        // Verify the requested key matches the lesson's pending videoKey
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
 * Step 3: Complete Multipart Upload
 * Finalizes the upload and triggers processing.
 */
export const completeMultipartUploadAction = safeAction(
    CompleteMultipartSchema,
    async ({ lessonId, uploadId, key, parts }, { user }) => {
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

            // 3. Trigger Processing (TODO: Worker integration)

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

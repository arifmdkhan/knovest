"use server";

import { getServerSession } from "@/lib/get-sessions";
import { StorageService } from "@/lib/storage/storage-service";
import { UploadIntent } from "@/lib/storage/types";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

/**
 * Step 1: Initiate Multipart Upload
 * Verifies lesson ownership, sets status to WAITING_UPLOAD, creates S3 Multipart Upload.
 */
export async function initiateMultipartUploadAction(
    lessonId: string,
    fileName: string,
    contentType: string,
    size: number
): Promise<ApiResponse<{ uploadId: string; key: string }>> {
    const session = await getServerSession();
    if (!session?.user?.id) return { status: "error", message: "Unauthorized" };

    // 1. Verify Ownership & Lesson Existence
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { chapter: { include: { course: true } } }
    });

    if (!lesson) return { status: "error", message: "Lesson not found" };
    if (lesson.chapter.course.userId !== session.user.id) {
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
                // We store the raw key in videoKey temporarily? 
                // Or better, we only set videoKey when transcoding is done.
                // But we need to know WHERE to find the raw file for processing.
                // Let's store it in videoKey for now, and update it to manifest path later?
                // Or maybe we don't assume videoKey is M3U8 yet?
                // Plan: videoKey will hold the S3 Key. 
                // Status "WAITING_UPLOAD" -> videoKey is RAW.
                // Status "READY" -> videoKey is M3U8.
                videoKey: key,
            }
        });

        return { status: "success", message: "Upload initiated", data: { uploadId, key } };

    } catch (error: any) {
        console.error("Init Upload Error:", error);
        return { status: "error", message: error.message || "Failed to initiate upload" };
    }
}

/**
 * Step 2: Get Presigned URLs for Parts
 * Client calls this in batches to get URLs for uploading chunks.
 */
export async function getMultipartUploadUrlsAction(
    lessonId: string,
    uploadId: string,
    key: string,
    partNumbers: number[]
): Promise<ApiResponse<{ parts: { partNumber: number; url: string }[] }>> {
    const session = await getServerSession();
    if (!session?.user?.id) return { status: "error", message: "Unauthorized" };

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
        return { status: "error", message: "Failed to generate upload URLs" };
    }
}

/**
 * Step 3: Complete Multipart Upload
 * Finalizes the upload and triggers processing.
 */
export async function completeMultipartUploadAction(
    lessonId: string,
    uploadId: string,
    key: string,
    parts: { ETag: string; PartNumber: number }[]
): Promise<ApiResponse> {
    const session = await getServerSession();
    if (!session?.user?.id) return { status: "error", message: "Unauthorized" };

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

        // 3. Trigger Processing (TODO)
        // For now, we just mark it uploaded. In Part 2 we will add the worker trigger here.

        revalidatePath(`/academy/creator/courses`);
        return { status: "success", message: "Upload completed" };

    } catch (error: any) {
        console.error("Complete Upload Error:", error);
        return { status: "error", message: error.message || "Failed to complete upload" };
    }
}

"use server";

import { z } from "zod";
import { StorageService } from "@/lib/storage/storage-service";
import { UploadIntent } from "@/lib/storage/types";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { safeAction } from "@/lib/safe-action";

// --- Schemas ---

const GetPresignedUrlSchema = z.object({
    intent: z.nativeEnum(UploadIntent),
    params: z.record(z.string(), z.string()),
    contentType: z.string(),
    size: z.number().max(5 * 1024 * 1024 * 1024), // Max 5GB generic limit? Or granular.
});

const ConfirmUploadSchema = z.object({
    tempKey: z.string().min(1),
    intent: z.nativeEnum(UploadIntent),
    params: z.record(z.string(), z.string()),
});

// --- Actions ---

export const getPresignedUploadUrlAction = safeAction(
    GetPresignedUrlSchema,
    async ({ intent, params, contentType, size }, { user }) => {
        const userScopedIntents = [UploadIntent.USER_AVATAR, UploadIntent.VERIFICATION_DOC, UploadIntent.BROKER_PNL];

        // 1. Force User ID for user-scoped intents
        // 1. Force User ID for user-scoped intents
        if (userScopedIntents.includes(intent)) {
            params.userId = user!.id;
        }
        // 2. Verify Post Ownership
        else if (intent === UploadIntent.POST_MEDIA) {
            if (!params.postId) return { status: "error", message: "Missing postId" };

            // Check if post exists
            const post = await prisma.post.findUnique({
                where: { id: params.postId },
                select: { authorId: true }
            });

            // If post exists, strictly enforce ownership
            if (post) {
                if (post.authorId !== user!.id) {
                    return { status: "error", message: "Unauthorized: Not your post" };
                }
            } else {
                // Post doesn't exist yet (Draft). Allow.
            }

        }
        // 3. Verify Course Ownership
        else if (intent.startsWith('COURSE_')) {
            if (!params.courseId) return { status: "error", message: `Missing courseId for ${intent}` };

            const course = await prisma.course.findUnique({
                where: { id: params.courseId },
                select: { userId: true }
            });

            if (course) {
                if (course.userId !== user!.id) return { status: "error", message: "Unauthorized: Not your course" };
            } else {
                // Course doesn't exist yet (Draft). Allow.
            }
        }

        try {
            const { url, tempKey } = await StorageService.getPresignedUploadUrl(intent, params as Record<string, string>, contentType, size);
            return { status: "success", message: "URL generated", data: { url, tempKey } };
        } catch (error: any) {
            console.error("Presign Error:", error);
            const message = error.message || "Failed to generate URL";
            return { status: "error", message };
        }
    },
    { requiredRole: "USER" }
);

export const confirmUploadAction = safeAction(
    ConfirmUploadSchema,
    async ({ tempKey, intent, params }, { user }) => {
        const userScopedIntents = [UploadIntent.USER_AVATAR, UploadIntent.VERIFICATION_DOC, UploadIntent.BROKER_PNL];
        if (userScopedIntents.includes(intent)) {
            params.userId = user!.id;
        }

        try {
            const finalKey = await StorageService.confirmUpload(tempKey, intent, params as Record<string, string>);

            if (intent === UploadIntent.USER_AVATAR) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: params.userId },
                    select: { image: true }
                });

                await prisma.user.update({
                    where: { id: params.userId },
                    data: { image: finalKey },
                });

                // Cleanup old avatar if exists and different
                if (currentUser?.image && currentUser.image !== finalKey) {
                    const { deleteMediaAction } = await import("@/features/media/actions/delete-media.action");
                    // We don't await this strictly to fail the request
                    await deleteMediaAction(currentUser.image).catch(e => console.error("Failed to delete old avatar", e));
                }

                revalidatePath(`/profile/${user!.username}`);
            }

            return { status: "success", message: "Upload confirmed", data: { key: finalKey } };
        } catch (error: any) {
            console.error("Confirm Error:", error);
            const message = error.message || "Failed to confirm upload";
            return { status: "error", message };
        }
    },
    { requiredRole: "USER" }
);

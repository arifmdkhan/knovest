"use server";

import { z } from "zod";
import { StorageService } from "@/lib/storage/storage-service";
import { UploadIntent } from "@/lib/storage/types";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { safeAction } from "@/lib/safe-action";
import { constructUrl } from "@/lib/construct-url";
import { BucketType, UPLOAD_CONFIGS } from "@/lib/storage/types";
import { enforceUploadQuota } from "@/lib/rate-limit";


const GetPresignedUrlSchema = z.object({
    intent: z.nativeEnum(UploadIntent),
    params: z.record(z.string(), z.string()),
    contentType: z.string(),
    size: z.number().int().positive().max(5 * 1024 * 1024 * 1024),
});

const ConfirmUploadSchema = z.object({
    tempKey: z.string().min(1),
    intent: z.nativeEnum(UploadIntent),
    params: z.record(z.string(), z.string()),
});



export const getPresignedUploadUrlAction = safeAction(
    GetPresignedUrlSchema,
    async ({ intent, params, contentType, size }, { user }) => {
        if (intent === UploadIntent.COURSE_LESSON_VIDEO && process.env.NODE_ENV === "production" && process.env.VIDEO_PROCESSING_ENABLED !== "true") return { status: "error", message: "Lesson video uploads are unavailable until video processing is enabled" };
        params.userId = user!.id;
        const userScopedIntents = [UploadIntent.USER_AVATAR, UploadIntent.VERIFICATION_DOC, UploadIntent.BROKER_PNL];

        if (userScopedIntents.includes(intent)) {
            params.userId = user!.id;
        }
        // 1. Verify Post Ownership
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
                // Post doesn't exist yet (Draft)
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
            // Charge the intent maximum: a client cannot evade its quota by understating size.
            await enforceUploadQuota(user!.id, UPLOAD_CONFIGS[intent].maxSize);
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
        if (intent === UploadIntent.COURSE_LESSON_VIDEO && process.env.NODE_ENV === "production" && process.env.VIDEO_PROCESSING_ENABLED !== "true") return { status: "error", message: "Lesson video uploads are unavailable until video processing is enabled" };
        params.userId = user!.id;
        for (const id of Object.values(params)) {
            if (id.includes("/") || id.includes("..")) return { status: "error", message: "Invalid upload identifier" };
        }
        if (intent.startsWith("COURSE_")) {
            const course = await prisma.course.findUnique({ where: { id: params.courseId }, select: { userId: true } });
            if (course && course.userId !== user!.id) return { status: "error", message: "You do not own this course" };
        }
        if (intent.startsWith("ARTICLE_")) {
            const article = await prisma.article.findUnique({ where: { id: params.articleId }, select: { authorId: true } });
            if (article && article.authorId !== user!.id) return { status: "error", message: "You do not own this article" };
        }
        if (intent === UploadIntent.POST_MEDIA) {
            const post = await prisma.post.findUnique({ where: { id: params.postId }, select: { authorId: true } });
            if (post && post.authorId !== user!.id) return { status: "error", message: "You do not own this post" };
        }
        if (intent === UploadIntent.CHAT_GROUP_IMAGE) {
            const { StreamChat } = await import("stream-chat");
            const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
            const { channel } = await client.channel("messaging", params.channelId).query({ watch: false, state: true });
            if (channel.created_by?.id !== user!.id) return { status: "error", message: "Only the group creator can change its image" };
        }
        const userScopedIntents = [UploadIntent.USER_AVATAR, UploadIntent.VERIFICATION_DOC, UploadIntent.BROKER_PNL];
        if (userScopedIntents.includes(intent)) {
            params.userId = user!.id;
        }

        try {
            const isPublic = UPLOAD_CONFIGS[intent].bucket === BucketType.PUBLIC;
            if (isPublic && !constructUrl("storage-check")) return { status: "error", message: "Public storage URL is not configured" };
            // Confirmation is charged too, preventing reuse of a signed PUT from
            // creating unlimited permanent copies under different post IDs.
            await enforceUploadQuota(user!.id, UPLOAD_CONFIGS[intent].maxSize);
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

            const previewUrl = intent === UploadIntent.POST_MEDIA ? await StorageService.getPresignedDownloadUrl(finalKey, 300) : undefined;
            return { status: "success", message: "Upload confirmed", data: { key: finalKey, url: isPublic ? constructUrl(finalKey) : previewUrl } };
        } catch (error: any) {
            console.error("Confirm Error:", error);
            const message = error.message || "Failed to confirm upload";
            return { status: "error", message };
        }
    },
    { requiredRole: "USER" }
);

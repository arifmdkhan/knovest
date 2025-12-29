"use server";

import { getServerSession } from "@/lib/get-sessions";
import { StorageService } from "@/lib/storage/storage-service";
import { UploadIntent } from "@/lib/storage/types";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { ApiResponse } from "@/types/api";

export async function getPresignedUploadUrlAction(
    intent: UploadIntent,
    params: Record<string, string>,
    contentType: string,
    size: number
): Promise<ApiResponse<{ url: string; tempKey: string }>> {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return { status: "error", message: "Unauthorized" };
    }

    const userScopedIntents = [UploadIntent.USER_AVATAR, UploadIntent.VERIFICATION_DOC, UploadIntent.BROKER_PNL];

    if (userScopedIntents.includes(intent)) {
        params.userId = session.user.id;
    } else if (intent === UploadIntent.POST_MEDIA) {
        if (!params.postId) return { status: "error", message: "Missing postId" };
    } else if (intent.startsWith('COURSE_')) {
        if (!params.courseId) return { status: "error", message: `Missing courseId for ${intent}` };
    }

    try {
        const { url, tempKey } = await StorageService.getPresignedUploadUrl(intent, params, contentType, size);
        return { status: "success", message: "URL generated", data: { url, tempKey } };
    } catch (error: unknown) {
        console.error("Presign Error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate URL";
        return { status: "error", message };
    }
}

export async function confirmUploadAction(
    tempKey: string,
    intent: UploadIntent,
    params: Record<string, string>
): Promise<ApiResponse<{ key: string }>> {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return { status: "error", message: "Unauthorized" };
    }

    const userScopedIntents = [UploadIntent.USER_AVATAR, UploadIntent.VERIFICATION_DOC, UploadIntent.BROKER_PNL];
    if (userScopedIntents.includes(intent)) {
        params.userId = session.user.id;
    }

    try {
        const finalKey = await StorageService.confirmUpload(tempKey, intent, params);

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
                // We don't await this strictly to fail the request, but good to have
                const { deleteMediaAction } = await import("@/server/actions/delete-media.actions");
                await deleteMediaAction(currentUser.image).catch(e => console.error("Failed to delete old avatar", e));
            }

            revalidatePath(`/profile/${session.user.username}`);
        }

        return { status: "success", message: "Upload confirmed", data: { key: finalKey } };
    } catch (error: unknown) {
        console.error("Confirm Error:", error);
        const message = error instanceof Error ? error.message : "Failed to confirm upload";
        return { status: "error", message };
    }
}

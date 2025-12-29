"use server";

import { requireUser } from "@/server/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { revalidatePath } from "next/cache";
import { deleteMediaAction } from "@/server/actions/delete-media.actions";

export async function DeleteArticle(articleId: string): Promise<ApiResponse> {
    const user = await requireUser();

    try {
        const existingArticle = await prisma.article.findUnique({
            where: {
                id: articleId,
                authorId: user.id,
            },
        });

        if (!existingArticle) {
            return { status: "error", message: "Article not found or unauthorized." };
        }

        // 1. Check if already ARCHIVED -> Hard Delete
        if (existingArticle.status === "ARCHIVED") {
            await prisma.article.delete({
                where: { id: articleId }
            });
            return { status: "success", message: "Article permanently deleted." };
        } else {
            // 2. Soft Delete (Archive)
            await prisma.article.update({
                where: { id: articleId },
                data: {
                    deletedAt: new Date(),
                    status: "ARCHIVED"
                }
            });
        }

        // 2. Immediate S3 Cleanup
        if (existingArticle.thumbnailKey) {
            let key = existingArticle.thumbnailKey;

            // Just in case it's a full URL (legacy or inconsistent data), try to parse
            if (key.startsWith("http")) {
                try {
                    const urlObj = new URL(key);
                    key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
                } catch (e) {
                    console.warn("Failed to parse S3 URL in Article delete, using as is:", key);
                }
            }

            console.log(`[DeleteArticle] Deleting S3 Object: ${key}`);
            // We don't await strictly to block response? Or we do? 
            // User wants "Fix properly", so let's await to be sure.
            try {
                await deleteMediaAction(key);
            } catch (e) {
                console.error("Failed to delete article thumbnail from S3", e);
            }
        }

        revalidatePath("/academy/creator");
        return { status: "success", message: "Article deleted successfully." };
    } catch (error) {
        console.error("Failed to delete article:", error);
        return { status: "error", message: "Failed to delete article." };
    }
}

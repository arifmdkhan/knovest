"use server";

import { prisma } from "@/lib/db";

import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";
import { deletePostSchema, DeletePostSchemaType } from "@/features/posts/schemas";
import { getServerSession } from "@/lib/get-sessions";

import { deleteMediaAction } from "@/features/media/actions/delete-media.action";

export async function deletePost(data: DeletePostSchemaType): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };

        const parsed = deletePostSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: "Invalid data" };

        const { postId } = parsed.data;
        const userId = session.user.id;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                authorId: true,
                media: true
            }
        });

        if (!post) {
            return { status: "error", message: "Post not found" };
        }

        if (post.authorId !== userId) {
            return { status: "error", message: "You can only delete your own posts" };
        }

        // 1. Soft Delete Post in DB
        await prisma.post.update({
            where: { id: postId },
            data: { deletedAt: new Date() }
        });

        // 2. Immediate S3 Cleanup
        if (post.media && post.media.length > 0) {
            const deletePromises = post.media.map(m => {
                let key = m.url;
                try {
                    // Attempt to extract key from URL
                    if (key.startsWith("http")) {
                        const urlObj = new URL(key);
                        // Pathname includes the leading slash, e.g. /users/123/image.png
                        // S3 keys usually don't have leading slash, but validation in deleteMediaAction handles prefixes.
                        // However, standard S3 SDK might expect no leading slash.
                        key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
                    }
                } catch (e) {
                    // If URL parsing fails, assume it's already a key or leave as is
                    console.warn("Failed to parse S3 URL, using as key:", key);
                }

                console.log(`[deletePost] Deleting S3 Object: ${key}`);
                return deleteMediaAction(key);
            });

            await Promise.all(deletePromises);
        }

        // Use waitUntil for background cleanup if available/Next.js allow? 
        // Or just normal await.
        // For now, I will NOT put the code blindly.
        // I need to check `delete-media.actions.ts`.

        revalidatePath("/feed");
        return { status: "success", message: "Post deleted successfully" };

    } catch (error) {
        console.error("Delete Post Error:", error);
        return { status: "error", message: "Failed to delete post" };
    }
}

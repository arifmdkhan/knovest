"use server";

import { requireVisiblePost } from "@/features/posts/access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

import { ApiResponse } from "@/types/api";
import { toggleSaveSchema, ToggleSaveSchemaType } from "@/features/posts/schemas";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";

export async function toggleSave(data: ToggleSaveSchemaType): Promise<ApiResponse<{ saved: boolean }>> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };
        await enforceRateLimit(`mutations:${session.user.id}`, 60);

        const parsed = toggleSaveSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: "Invalid data" };

        const { postId } = parsed.data;
        const userId = session.user.id;
        const visiblePost = await requireVisiblePost(postId, userId);
        void visiblePost;

        const existingSave = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        let saved = false;

        if (existingSave) {
            await prisma.savedPost.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            saved = false;
        } else {
            await prisma.savedPost.create({
                data: {
                    userId,
                    postId,
                },
            });
            saved = true;
        }

        revalidatePath("/bookmark");
        revalidatePath("/home");

        return {
            status: "success",
            message: saved ? "Saved to bookmarks" : "Removed from bookmarks",
            data: { saved }
        };

    } catch (error) {
        console.error("Toggle Save Error:", error);
        return { status: "error", message: "Failed to update bookmark" };
    }
}

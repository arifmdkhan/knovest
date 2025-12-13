"use server";

import { prisma } from "@/lib/db";

import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/lib/types";
import { deletePostSchema, DeletePostSchemaType } from "@/lib/schema/post-schema";
import { getServerSession } from "@/lib/get-sessions";

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
            select: { authorId: true }
        });

        if (!post) {
            return { status: "error", message: "Post not found" };
        }

        if (post.authorId !== userId) {
            return { status: "error", message: "You can only delete your own posts" };
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        revalidatePath("/feed");
        return { status: "success", message: "Post deleted successfully" };

    } catch (error) {
        console.error("Delete Post Error:", error);
        return { status: "error", message: "Failed to delete post" };
    }
}

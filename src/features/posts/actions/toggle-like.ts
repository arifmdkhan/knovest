"use server";

import { prisma } from "@/lib/db";

import { ApiResponse } from "@/types/api";
import { toggleLikeSchema, ToggleLikeSchemaType } from "@/features/posts/schemas";
import { getServerSession } from "@/lib/get-sessions";
import { createNotification } from "@/features/notifications/actions/notifications.action";

export async function toggleLike(data: ToggleLikeSchemaType): Promise<ApiResponse<{ liked: boolean; count: number }>> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };

        const parsed = toggleLikeSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: "Invalid data" };

        const { postId } = parsed.data;
        const userId = session.user.id;

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        let liked = false;

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            liked = false;
        } else {
            const [_, post] = await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userId,
                        postId,
                    },
                }),
                prisma.post.findUnique({
                    where: { id: postId },
                    select: { authorId: true }
                })
            ]);

            liked = true;

            if (post?.authorId) {
                await createNotification({
                    recipientId: post.authorId,
                    actorId: userId,
                    type: "LIKE",
                    entityId: postId,
                    message: "liked your post"
                });
            }
        }

        const count = await prisma.like.count({ where: { postId } });

        return {
            status: "success",
            message: liked ? "Liked" : "Unliked",
            data: { liked, count }
        };

    } catch (error) {
        console.error("Toggle Like Error:", error);
        return { status: "error", message: "Failed to update like" };
    }
}

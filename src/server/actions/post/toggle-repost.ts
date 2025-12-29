"use server";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { toggleRepostSchema, ToggleRepostSchemaType } from "@/lib/schema/post-schema";
import { getServerSession } from "@/lib/get-sessions";
import { createNotification } from "@/server/actions/notifications";

export async function toggleRepost(data: ToggleRepostSchemaType): Promise<ApiResponse<{ reposted: boolean; count: number }>> {
    try {

        const session = await getServerSession();

        if (!session?.user) return { status: "error", message: "Unauthorized" };

        const parsed = toggleRepostSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: "Invalid data" };

        const { postId } = parsed.data;
        const userId = session.user.id;

        // Check if user already reposted this post
        // A repost is a Post where authorId is current user AND originalPostId is the target post
        const existingRepost = await prisma.post.findFirst({
            where: {
                authorId: userId,
                originalPostId: postId
            }
        });

        let reposted = false;

        if (existingRepost) {
            // Un-repost: Delete the repost entry
            await prisma.post.delete({
                where: {
                    id: existingRepost.id
                }
            });
            reposted = false;
        } else {
            // Repost: Create a new Post linking to the original
            const [_, originalPost] = await prisma.$transaction([
                prisma.post.create({
                    data: {
                        authorId: userId,
                        originalPostId: postId,
                        visibility: 'PUBLIC',
                        content: null,
                    }
                }),
                prisma.post.findUnique({
                    where: { id: postId },
                    select: { authorId: true }
                })
            ]);
            reposted = true;
            console.log("toggleRepost: Repost created. Triggers notif check.");

            if (originalPost?.authorId) {
                console.log("toggleRepost: Original author found", originalPost.authorId);
                await createNotification({
                    recipientId: originalPost.authorId,
                    actorId: userId,
                    type: "REPOST",
                    entityId: postId,
                    message: "reposted your post"
                });
            } else {
                console.log("toggleRepost: Original author NOT found for post", postId);
            }
        }

        // Count how many posts have this postId as originalPostId
        const count = await prisma.post.count({
            where: { originalPostId: postId }
        });

        return {
            status: "success",
            message: reposted ? "Reposted" : "Removed repost",
            data: { reposted, count }
        };

    } catch (error) {
        console.error("Toggle Repost Error:", error);
        return { status: "error", message: "Failed to update repost" };
    }
}

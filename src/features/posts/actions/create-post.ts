"use server";

import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";
import { createPostSchema, CreatePostSchemaType } from "@/features/posts/schemas";
import { FeedPost } from "@/types/post";
import { isPostAssetKey } from "@/lib/storage/asset-keys";
import { postMediaUrl } from "@/features/posts/access";

export async function createPost(data: CreatePostSchemaType): Promise<ApiResponse<FeedPost>> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };
        await enforceRateLimit(`mutations:${session.user.id}`, 60);
        if (session.user.banned) return { status: "error", message: "Your account is banned" };

        const parsed = createPostSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: parsed.error.issues.some(issue => issue.path[0] === "media") ? "An attachment is invalid. Remove it and upload it again." : "Invalid post data" };

        const { content, visibility, media, id } = parsed.data;
        if (media?.some(item => !id || !item.key || !isPostAssetKey(item.key, session.user.id, id))) {
            return { status: "error", message: "Upload each attachment to this post before publishing" };
        }

        if (!content?.trim() && (!media || media.length === 0)) {
            return { status: "error", message: "Post cannot be empty" };
        }

        const newPost = await prisma.post.create({
            data: {
                id, // Use provided ID if available
                content,
                visibility,
                authorId: session.user.id,
                media: {
                    create: media?.map((m, index) => ({
                        url: m.key!,
                        type: m.type,
                        width: m.width,
                        height: m.height,
                        order: index
                    }))
                }
            },
            include: {
                author: { select: { id: true, name: true, username: true, image: true, expertVerificationType: true, accountVerificationType: true } },
                media: true,
                _count: { select: { likes: true, comments: true } }
            }
        });

        // Explicitly set counts and state for the new post
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _count, ...rest } = newPost;

        const formattedPost: FeedPost = {
            ...rest,
            media: newPost.media.map(item => ({ ...item, url: postMediaUrl(newPost.id, item.id) })),
            hasLiked: false,
            isSaved: false,
            isReposted: false,
            originalPost: null,
            _count: { likes: 0, comments: 0, other_Post: 0 }
        };

        revalidatePath("/home");
        if (session.user.username) revalidatePath(`/profile/${session.user.username}`);
        return { status: "success", message: "Post created", data: formattedPost };

    } catch (error) {
        console.error("Create Post Error:", error);
        return { status: "error", message: "Failed to create post" };
    }
}

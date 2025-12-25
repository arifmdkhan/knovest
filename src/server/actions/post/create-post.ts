"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/lib/types";
import { createPostSchema, CreatePostSchemaType } from "@/lib/schema/post-schema";
import { FeedPost } from "@/types/post";

export async function createPost(data: CreatePostSchemaType): Promise<ApiResponse<FeedPost>> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };

        const parsed = createPostSchema.safeParse(data);
        if (!parsed.success) return { status: "error", message: "Invalid post data" };

        const { content, visibility, media } = parsed.data;

        if (!content?.trim() && (!media || media.length === 0)) {
            return { status: "error", message: "Post cannot be empty" };
        }

        const newPost = await prisma.post.create({
            data: {
                content,
                visibility,
                authorId: session.user.id,
                media: {
                    create: media?.map((m, index) => ({
                        url: m.url,
                        type: m.type,
                        width: m.width,
                        height: m.height,
                        order: index
                    }))
                }
            },
            include: {
                author: { select: { id: true, name: true, username: true, image: true, isVerified: true, isSebiVerified: true } },
                media: true,
                _count: { select: { likes: true, comments: true } }
            }
        });

        // Explicitly set counts and state for the new post
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _count, ...rest } = newPost;

        const formattedPost: FeedPost = {
            ...rest,
            hasLiked: false,
            isSaved: false,
            isReposted: false,
            originalPost: null,
            _count: { likes: 0, comments: 0, other_Post: 0 }
        };

        revalidatePath("/feed");
        return { status: "success", message: "Post created", data: formattedPost };

    } catch (error) {
        console.error("Create Post Error:", error);
        return { status: "error", message: "Failed to create post" };
    }
}

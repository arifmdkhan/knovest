"use server";

import { getFeedPosts, FeedType } from "@/app/data/post/get-posts";
import { ApiResponse } from "@/lib/types";
import { FeedPost } from "@/types/post";

export async function getFeedPostsAction(
    cursor?: string,
    limit = 10,
    authorId?: string,
    type: FeedType = 'FOR_YOU'
): Promise<ApiResponse<{ posts: FeedPost[]; nextCursor?: string | undefined }>> {
    try {
        const data = await getFeedPosts(cursor, limit, authorId, type);
        return { status: "success", message: "Posts fetched successfully", data };
    } catch (error) {
        console.error("Error in getFeedPostsAction:", error);
        return { status: "error", message: "Failed to fetch posts" };
    }
}

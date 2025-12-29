"use server";

import { getSavedPosts } from "@/server/data/post/get-saved-posts";
import { ApiResponse } from "@/types/api";
import { FeedPost } from "@/types/post";

export async function getSavedPostsAction(cursor?: string, limit = 10): Promise<ApiResponse<{ posts: FeedPost[]; nextCursor?: string | undefined }>> {
    try {
        const data = await getSavedPosts(cursor, limit);
        return { status: "success", message: "Saved posts fetched successfully", data };
    } catch (error) {
        console.error("Error in getSavedPostsAction:", error);
        return { status: "error", message: "Failed to fetch saved posts" };
    }
}

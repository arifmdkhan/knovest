"use server";

import { getSavedPosts } from "@/app/data/post/get-saved-posts";

export async function getSavedPostsAction(cursor?: string, limit = 10) {
    try {
        const data = await getSavedPosts(cursor, limit);
        return data;
    } catch (error) {
        console.error("Error in getSavedPostsAction:", error);
        return { posts: [], nextCursor: undefined };
    }
}

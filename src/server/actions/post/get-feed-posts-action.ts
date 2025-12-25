"use server";

import { getFeedPosts, FeedType } from "@/app/data/post/get-posts";

export async function getFeedPostsAction(
    cursor?: string,
    limit = 10,
    authorId?: string,
    type: FeedType = 'FOR_YOU'
) {
    try {
        const data = await getFeedPosts(cursor, limit, authorId, type);
        return data;
    } catch (error) {
        console.error("Error in getFeedPostsAction:", error);
        return { posts: [], nextCursor: undefined };
    }
}

import "server-only";
import { prisma } from "@/lib/db";

import { notFound } from "next/navigation";
import { FeedPost } from "@/types/post";
import { getServerSession } from "@/lib/get-sessions";

export async function getPost(postId: string): Promise<FeedPost> {
    const session = await getServerSession();
    const userId = session?.user?.id;

    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    expertVerificationType: true,
                    accountVerificationType: true,
                }
            },
            media: true,
            _count: { select: { likes: true, comments: true } },
            likes: userId ? { where: { userId }, select: { id: true } } : false,
            savedBy: userId ? { where: { userId }, select: { id: true } } : false,
        }
    });

    if (!post) {
        notFound();
    }

    const formattedPost: FeedPost = {
        ...post,
        hasLiked: post.likes?.length > 0,
        isSaved: post.savedBy?.length > 0,
        likes: undefined,
        savedBy: undefined
    } as any;

    return formattedPost;
}

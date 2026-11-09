import "server-only";
import { prisma } from "@/lib/db";

import { FeedPost } from "@/types/post";
import { getServerSession } from "@/lib/get-sessions";
import { readablePostWhere, postMediaUrl } from "@/features/posts/access";

export async function getPost(postId: string): Promise<FeedPost | null> {
    const session = await getServerSession();
    const userId = session?.user?.id;

    const post = await prisma.post.findFirst({
        where: { id: postId, ...readablePostWhere(userId) },
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
        return null;
    }

    const formattedPost: FeedPost = {
        ...post,
        media: post.media.map(item => ({ ...item, url: postMediaUrl(post.id, item.id) })),
        hasLiked: post.likes?.length > 0,
        isSaved: post.savedBy?.length > 0,
        likes: undefined,
        savedBy: undefined
    } as any;

    return formattedPost;
}

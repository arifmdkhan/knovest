import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";

export async function getSavedPosts(cursor?: string, limit = 10) {
    const session = await getServerSession();
    if (!session?.user) return { posts: [], nextCursor: undefined };

    const userId = session.user.id;

    const savedPosts = await prisma.savedPost.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined, // Using SavedPost ID as cursor
        orderBy: { createdAt: 'desc' },
        where: { userId },
        include: {
            post: {
                include: {
                    author: { select: { id: true, name: true, username: true, image: true, isVerified: true, isSebiVerified: true } },
                    media: true,
                    _count: { select: { likes: true, comments: true } },
                    likes: { where: { userId }, select: { id: true } },
                    savedBy: { where: { userId }, select: { id: true } },
                }
            }
        }
    });

    let nextCursor: string | undefined = undefined;
    if (savedPosts.length > limit) {
        const nextItem = savedPosts.pop();
        nextCursor = nextItem?.id;
    }

    // Transform to flat FeedPost structure
    const posts = savedPosts.map(item => ({
        ...item.post,
        hasLiked: item.post.likes.length > 0,
        isSaved: true, // By definition
        likes: undefined,
        savedBy: undefined
    }));

    return { posts, nextCursor };
}

import "server-only";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { FeedPost } from "@/types/post";

export type FeedType = 'FOR_YOU' | 'FOLLOWING' | 'SUBSCRIBED';

export async function getFeedPosts(cursor?: string, limit = 10, authorId?: string, type: FeedType = 'FOR_YOU', explicitUserId?: string): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
    let session;
    if (!explicitUserId) {
        try {
            session = await getServerSession();
        } catch (error) {
            console.error("getFeedPosts Session Error:", error);
            // Continue without session (guest mode)
        }
    }
    const userId = explicitUserId || session?.user?.id;

    let subscribedToIds: string[] = [];
    let followingIds: string[] = [];

    if (userId) {
        const subscriptions = await prisma.subscription.findMany({
            where: {
                subscriberId: userId,
                status: 'ACTIVE'
            },
            select: { subscribedToId: true }
        });
        subscribedToIds = subscriptions.map(s => s.subscribedToId);

        const following = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                following: {
                    select: { followingId: true }
                }
            }
        });
        followingIds = following?.following.map(f => f.followingId) || [];
    }

    const orConditions: any[] = [];

    if (authorId) {
        // Profile Feed Logic (Specific Author)
        orConditions.push({ authorId: authorId, visibility: 'PUBLIC' });
        if (userId) {
            if (userId === authorId) {
                // Author sees everything
                orConditions.push({ authorId: authorId });
            } else {
                if (followingIds.includes(authorId)) {
                    orConditions.push({ authorId: authorId, visibility: 'FOLLOWERS' });
                }
                if (subscribedToIds.includes(authorId)) {
                    orConditions.push({ authorId: authorId, visibility: 'SUBSCRIBER' });
                }
            }
        }
    } else {
        // Main Feed Logic
        if (type === 'FOR_YOU') {
            orConditions.push({ visibility: 'PUBLIC' });
            if (userId) {
                orConditions.push({ authorId: userId }); // Own posts
                if (followingIds.length > 0) {
                    orConditions.push({
                        visibility: 'FOLLOWERS',
                        authorId: { in: followingIds }
                    });
                }
                if (subscribedToIds.length > 0) {
                    orConditions.push({
                        visibility: 'SUBSCRIBER',
                        authorId: { in: subscribedToIds }
                    });
                }
            }
        } else if (type === 'FOLLOWING') {
            if (userId && followingIds.length > 0) {
                // Posts from followed users
                // Include PUBLIC and FOLLOWERS visibility
                // Include SUBSCRIBER visibility ONLY if also subscribed
                orConditions.push({
                    authorId: { in: followingIds },
                    visibility: { in: ['PUBLIC', 'FOLLOWERS'] }
                });

                // Intersection of Following AND Subscribed for SUBSCRIBER posts
                const followingAndSubscribed = followingIds.filter(id => subscribedToIds.includes(id));
                if (followingAndSubscribed.length > 0) {
                    orConditions.push({
                        authorId: { in: followingAndSubscribed },
                        visibility: 'SUBSCRIBER'
                    });
                }
            } else {
                // If not logged in or following no one, show nothing or empty
                orConditions.push({ id: 'NO_MATCH' }); // Hack to return empty
            }
        } else if (type === 'SUBSCRIBED') {
            if (userId && subscribedToIds.length > 0) {
                // Posts from subscribed users ONLY with SUBSCRIBER visibility
                orConditions.push({
                    authorId: { in: subscribedToIds },
                    visibility: 'SUBSCRIBER'
                });
            } else {
                orConditions.push({ id: 'NO_MATCH' });
            }
        }
    }

    // Fallback for empty OR conditions to avoid fetching everything if logic falls through
    if (orConditions.length === 0) {
        orConditions.push({ id: 'NO_MATCH' });
    }

    const whereClause: any = {
        OR: orConditions
    };

    let posts;
    try {
        posts = await prisma.post.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'desc' },
            where: whereClause,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        isVerified: true,
                        isSebiVerified: true,
                    }
                },
                media: true,
                _count: { select: { likes: true, comments: true, other_Post: true } },
                likes: userId ? { where: { userId }, select: { id: true } } : false,
                savedBy: userId ? { where: { userId }, select: { id: true } } : false,
                other_Post: userId ? { where: { authorId: userId }, select: { id: true } } : false,
                Post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                                isVerified: true,
                                isSebiVerified: true,
                            }
                        },
                        media: true,
                        _count: { select: { likes: true, comments: true, other_Post: true } },
                        likes: userId ? { where: { userId }, select: { id: true } } : false,
                        savedBy: userId ? { where: { userId }, select: { id: true } } : false,
                        other_Post: userId ? { where: { authorId: userId }, select: { id: true } } : false,
                    }
                }
            }
        });
    } catch (error) {
        console.error("getFeedPosts Prisma Error:", error);
        throw error;
    }

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
    }

    const formattedPosts: FeedPost[] = posts.map(post => {
        // Helper to format a post object (reused for originalPost)
        const formatPost = (p: any) => ({
            ...p,
            hasLiked: p.likes?.length > 0,
            isSaved: p.savedBy?.length > 0,
            isReposted: p.other_Post?.length > 0,
            likes: undefined,
            savedBy: undefined,
            other_Post: undefined,
            Post: undefined, // Remove circular/raw ref
        });

        const formatted = formatPost(post);

        // If this is a repost (has originalPostId and Post data), attach it
        if (post.Post) {
            formatted.originalPost = formatPost(post.Post);
        }

        return formatted;
    }) as any;

    return { posts: formattedPosts, nextCursor };
}

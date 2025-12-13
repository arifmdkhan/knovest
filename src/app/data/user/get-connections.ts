import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";

export type ConnectionType = 'FOLLOWERS' | 'FOLLOWING' | 'SUBSCRIBERS';

export async function getUserConnections(userId: string, type: ConnectionType, cursor?: string, limit = 10) {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    // Strict Privacy Check: Only the owner can see these lists
    if (currentUserId !== userId) {
        throw new Error("Unauthorized: You can only view your own connections.");
    }

    let items: any[] = [];
    let nextCursor: string | undefined = undefined;

    if (type === 'FOLLOWERS') {
        const followers = await prisma.follow.findMany({
            take: limit + 1,
            cursor: cursor ? { followerId_followingId: { followerId: cursor, followingId: userId } } : undefined,
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        isVerified: true,
                        isSebiVerified: true,
                    }
                }
            }
        });

        if (followers.length > limit) {
            const nextItem = followers.pop();
            nextCursor = nextItem?.followerId;
        }

        items = followers.map(f => f.follower);

    } else if (type === 'FOLLOWING') {
        const following = await prisma.follow.findMany({
            take: limit + 1,
            cursor: cursor ? { followerId_followingId: { followerId: userId, followingId: cursor } } : undefined,
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        isVerified: true,
                        isSebiVerified: true,
                    }
                }
            }
        });

        if (following.length > limit) {
            const nextItem = following.pop();
            nextCursor = nextItem?.followingId;
        }

        items = following.map(f => f.following);

    } else if (type === 'SUBSCRIBERS') {
        const subscribers = await prisma.subscription.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            where: {
                subscribedToId: userId,
                status: 'ACTIVE' // Only show active subscribers
            },
            include: {
                subscriber: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        isVerified: true,
                        isSebiVerified: true,
                    }
                }
            }
        });

        if (subscribers.length > limit) {
            const nextItem = subscribers.pop();
            nextCursor = nextItem?.id;
        }

        items = subscribers.map(s => s.subscriber);
    }

    return { items, nextCursor };
}

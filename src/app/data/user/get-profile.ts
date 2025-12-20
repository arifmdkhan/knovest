import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { cache } from "react";

// Cached function to fetch profile by username
export const getProfileByUsername = cache(async (username: string) => {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            _count: {
                select: {
                    followedBy: true, // This counts the 'followedBy' relation (Followers)
                    following: true,  // This counts the 'following' relation (Following)
                    posts: true,
                }
            },
            // Check if current user is following this profile
            // We look for a Follow record where followerId = currentUser AND followingId = profileUser
            followedBy: currentUserId ? {
                where: { followerId: currentUserId },
                select: { followerId: true }
            } : false,
        }
    });

    if (!user) return null;

    // Fetch active subscribers count separately
    const subscribersCount = await prisma.subscription.count({
        where: {
            subscribedToId: user.id,
            status: "ACTIVE"
        }
    });

    console.log(`[getProfileByUsername] Fetching ${username}, Image: ${user.image}`);

    return {
        ...user,
        isFollowing: user.followedBy?.length > 0,
        followersCount: user._count.followedBy, // Map 'followedBy' count to followersCount
        followingCount: user._count.following,  // Map 'following' count to followingCount
        postsCount: user._count.posts,
        subscribersCount: subscribersCount,
        // Remove internal relation arrays to keep the return object clean
        followedBy: undefined,
        _count: undefined,
    };
});

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";

export async function getFollowSuggestions(limit = 5) {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId) return [];

    // Fetch users who are NOT the current user and are NOT already followed
    const suggestions = await prisma.user.findMany({
        take: limit,
        where: {
            AND: [
                { id: { not: currentUserId } },
                {
                    followedBy: {
                        none: {
                            followerId: currentUserId,
                        },
                    },
                },
            ],
        },
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            isVerified: true,
            isSebiVerified: true,
        },
        orderBy: {
            // Simple heuristic: suggest users who joined recently or randomly
            // For better results, sort by follower count (requires aggregation or raw query)
            createdAt: 'desc'
        }
    });

    return suggestions;
}

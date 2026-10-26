import "server-only";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { cache } from "react";

// Cached function to fetch profile by username
export const getProfileByUsername = cache(async (username: string) => {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    const user = await prisma.user.findUnique({
        where: { username, deletedAt: null },
        select: {
            id: true, name: true, username: true, image: true, bio: true,
            location: true, website: true, createdAt: true, expertise: true,
            expertVerificationType: true, accountVerificationType: true,
            isSubscriptionEnabled: true, subscriptionPrice: true,
            _count: {
                select: {
                    followedBy: true, 
                    following: true,  
                    posts: true,
                }
            },
            // Check if current user is following this profile
            // We look for a Follow record where followerId = currentUser AND followingId = profileUser
            followedBy: currentUserId ? {
                where: { followerId: currentUserId },
                select: { followerId: true }
            } : false,
            verificationApplication: {
                select: {
                    status: true,
                    sebiRegNumber: true,
                    sebiLicenseType: true,
                    sebiExpiry: true,
                    sebiRegName: true,
                    certifications: {
                        select: {
                            name: true,
                            issuingAuthority: true,
                            completionYear: true
                        }
                    },
                    brokerPnls: {
                        select: {
                            brokerName: true,
                        }
                    }
                }
            }
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

    return {
        id: user.id, name: user.name, username: user.username, image: user.image,
        bio: user.bio, location: user.location, website: user.website,
        createdAt: user.createdAt, expertise: user.expertise,
        expertVerificationType: user.expertVerificationType,
        accountVerificationType: user.accountVerificationType,
        isSubscriptionEnabled: user.isSubscriptionEnabled,
        subscriptionPrice: user.subscriptionPrice,
        verificationApplication: user.verificationApplication?.status === "APPROVED" ? {
            ...user.verificationApplication,
            sebiCertUrl: null,
            certifications: user.verificationApplication.certifications.map(item => ({ ...item, certUrl: null })),
            brokerPnls: user.verificationApplication.brokerPnls.map(item => ({ ...item, pnlLink: "", fileUrl: null })),
        } : null,
        isFollowing: user.followedBy?.length > 0,
        followersCount: user._count.followedBy, 
        followingCount: user._count.following,  
        postsCount: user._count.posts,
        subscribersCount: subscribersCount,
        // Remove internal relation arrays to keep the return object clean
        followedBy: undefined,
        _count: undefined,
    };
});

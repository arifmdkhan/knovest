"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";

export async function confirmSubscription(creatorId: string): Promise<ApiResponse> {
    try {
        const user = await requireUser();

        const pending = await prisma.subscription.findUnique({
            where: { subscriberId_subscribedToId: { subscriberId: user.id, subscribedToId: creatorId } },
            include: { subscribedTo: true },
        });
        if (!pending || !pending.subscribedTo.isSubscriptionEnabled || pending.subscribedTo.subscriptionPrice > 0) {
            return { status: "error", message: "Paid subscriptions require a verified payment. Payments are not available yet." };
        }
        if (pending.status !== "PENDING" && pending.status !== "ACTIVE") {
            return { status: "error", message: "This subscription cannot be confirmed." };
        }

        // 1. Update Subscription Status
        const subscription = await prisma.subscription.update({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: user.id,
                    subscribedToId: creatorId,
                },
            },
            data: {
                status: "ACTIVE",
            },
            include: {
                subscribedTo: true,
            },
        });

        
        // 2. Add to Stream Group
        let subscriptionChannelId = subscription.subscribedTo.subscriptionChannelId;

    
        // Lazy creation if missing
        if (!subscriptionChannelId && subscription.subscribedTo.isSubscriptionEnabled) {
            try {
                const creator = await prisma.user.findUnique({
                    where: { id: creatorId },
                    select: { username: true, image: true }
                });

                const { createSubscriptionGroup } = await import("@/features/media/services/subscription-channel");
                subscriptionChannelId = await createSubscriptionGroup(creatorId, creator?.username || "Creator", creator?.image);

                // Update user record
                await prisma.user.update({
                    where: { id: creatorId },
                    data: { subscriptionChannelId },
                });
                console.log(`Created missing subscription group for ${creatorId}: ${subscriptionChannelId}`);
            } catch (error) {
                console.error("Failed to lazy create subscription group:", error);
            }
        }

        if (subscriptionChannelId) {
            try {
                const { addSubscriberToGroup } = await import("@/features/media/services/subscription-channel");
                console.log(`Adding user ${user.id} to group ${subscriptionChannelId}`);
                await addSubscriberToGroup(subscriptionChannelId, user.id);
                console.log(`Successfully added user ${user.id} to group ${subscriptionChannelId}`);
            } catch (error) {
                console.error("Failed to add user to subscription group:", error);
               
            }
        } else {
            console.warn(`No subscription channel ID found for creator ${creatorId}`);
        }

        return {
            status: "success",
            message: "Subscription confirmed",
        };

    } catch (error) {
        console.error("Confirm Subscription Error:", error);
        return {
            status: "error",
            message: "Failed to confirm subscription",
        };
    }
}

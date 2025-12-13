"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

export async function checkSubscription(creatorId: string) {
    try {
        const user = await requireUser();

        if (user.id === creatorId) return "ACTIVE";

        const subscription = await prisma.subscription.findUnique({
            where: {
                subscriberId_subscribedToId: {
                    subscriberId: user.id,
                    subscribedToId: creatorId,
                },
            },
            select: {
                status: true,
            },
        });

        if (!subscription) return null;

        // Check if subscription is active
        if (subscription.status === "ACTIVE") {
            return "ACTIVE";
        }

        return subscription.status; // Return "PENDING", "CANCELLED", etc. or "ACTIVE" if valid
    } catch (error) {
        console.error("Error checking subscription:", error);
        return null;
    }
}

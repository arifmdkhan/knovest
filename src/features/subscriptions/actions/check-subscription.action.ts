"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";

export async function checkSubscription(creatorId: string): Promise<ApiResponse<"ACTIVE" | string | null>> {
    try {
        const user = await requireUser();

        if (user.id === creatorId) return { status: "success", message: "Active", data: "ACTIVE" };

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

        if (!subscription) return { status: "success", message: "No subscription", data: null };

        return { status: "success", message: "Subscription found", data: subscription.status };
    } catch (error) {
        console.error("Error checking subscription:", error);
        return { status: "error", message: "Failed to check subscription" };
    }
}

"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";

export async function cancelSubscription(subscriptionId: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        const userId = session?.user?.id;

        if (!userId) {
            return { status: "error", message: "Unauthorized" };
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            return { status: "error", message: "Subscription not found" };
        }

        if (subscription.subscriberId !== userId) {
            return { status: "error", message: "Unauthorized" };
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: "CANCELLED" },
            include: { subscribedTo: true }
        });

        const subscriptionChannelId = updatedSubscription.subscribedTo.subscriptionChannelId;
        if (subscriptionChannelId) {
            try {
                const { removeMemberFromChannel } = await import("@/features/media/services/subscription-channel");
                await removeMemberFromChannel(subscriptionChannelId, userId);
            } catch (error) {
                console.error("Failed to remove user from subscription group:", error);
            }
        }

        if (updatedSubscription.subscribedTo.username) {
            revalidatePath(`/profile/${updatedSubscription.subscribedTo.username}`);
        }
        revalidatePath("/settings");

        return { status: "success", message: "Subscription cancelled successfully" };

    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return { status: "error", message: "Failed to cancel subscription" };
    }
}

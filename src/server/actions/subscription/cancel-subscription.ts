"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";

export async function cancelSubscription(subscriptionId: string) {
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
            return { status: "error", message: "Unauthorized to cancel this subscription" };
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: "CANCELLED" },
            include: { subscribedTo: true }
        });

        // Remove from Stream Group if exists
        const subscriptionChannelId = updatedSubscription.subscribedTo.subscriptionChannelId;
        if (subscriptionChannelId) {
            try {
                const { removeMemberFromChannel } = await import("@/server/actions/stream");
                await removeMemberFromChannel(subscriptionChannelId, userId);
            } catch (error) {
                console.error("Failed to remove user from subscription group:", error);
            }
        }

        revalidatePath("/settings");
        revalidatePath("/(platform)/profile/[username]", "page");

        return { status: "success", message: "Subscription cancelled successfully" };

    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return { status: "error", message: "Failed to cancel subscription" };
    }
}

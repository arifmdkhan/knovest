"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

export async function getSubscriptionStatus() {
    try {
        const sessionUser = await requireUser();
        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { isSubscriptionEnabled: true },
        });
        return !!user?.isSubscriptionEnabled;
    } catch (error) {
        console.error("Failed to get subscription status:", error);
        return false;
    }
}

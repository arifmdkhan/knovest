"use server";

import { requireUser } from "@/server/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { redirect } from "next/navigation";

export async function getSubscriptionStatus(): Promise<ApiResponse<boolean>> {
    try {
        const sessionUser = await requireUser();
        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { isSubscriptionEnabled: true },
        });
        return {
            status: "success",
            message: "Subscription status fetched",
            data: !!user?.isSubscriptionEnabled
        };
    } catch (error) {
        console.error("Failed to get subscription status:", error);
        return { status: "error", message: "Failed to fetch status" };
    }
}

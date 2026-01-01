"use server";

import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";

export async function hasUserPaidForStream(streamId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
        if (!userId) return { status: "success", message: "Not logged in", data: false };

        const count = await prisma.streamAccess.count({
            where: {
                streamId,
                userId
            }
        });

        return { status: "success", message: "Payment status fetched", data: count > 0 };
    } catch (error) {
        console.error("Payment Check Error:", error);
        return { status: "error", message: "Failed to check payment status" };
    }
}

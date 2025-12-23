"use server";

import { prisma } from "@/lib/db";

export async function hasUserPaidForStream(streamId: string, userId: string) {
    if (!userId) return false;

    const count = await prisma.streamAccess.count({
        where: {
            streamId,
            userId
        }
    });

    return count > 0;
}

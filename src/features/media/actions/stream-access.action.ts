"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";

import { ApiResponse } from "@/types/api";

export async function purchaseStreamAccess(streamId: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const existingAccess = await prisma.streamAccess.findUnique({
            where: {
                userId_streamId: {
                    userId: session.user.id,
                    streamId: streamId,
                }
            }
        });

        if (existingAccess) {
            return { status: "success", message: "Already purchased" };
        }

        return { status: "error", message: "Payments are not available yet. Access requires a verified payment." };

    } catch (error: unknown) {
        console.error("Purchase failed:", error);
        return { status: "error", message: "Purchase failed" };
    }
}



export async function revokeStreamAccess(streamId: string, userId: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const { StreamClient } = await import("@stream-io/node-sdk");
        const client = new StreamClient(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const call = client.video.call("livestream", streamId);

        const callState = await call.get();
        const creatorId = callState.call.created_by.id;

        if (creatorId !== session.user.id) {
            return { status: "error", message: "Unauthorized" };
        }

        await call.updateCallMembers({
            remove_members: [userId]
        });

        try {
            await prisma.streamAccess.deleteMany({
                where: {
                    streamId,
                    userId
                }
            });
        } catch (error) {
            console.error("Failed to delete access record", error);
        }

        revalidatePath(`/trade-room/${streamId}`);
        return { status: "success", message: "Access revoked" };
    } catch (error) {
        console.error("Revoke Access Error:", error);
        return { status: "error", message: "Failed to revoke access" };
    }
}

export interface StreamAccessUser {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
    type: "paid" | "manual";
}

export async function getStreamAccessDetails(
    streamId: string,
    manualUserIds: string[],
    page: number = 1
): Promise<ApiResponse<{ paidUsers: StreamAccessUser[]; manualUsers: StreamAccessUser[]; hasMorePaid: boolean }>> {
    const session = await getServerSession();
    if (!session?.user) return { status: "error", message: "Unauthorized" };

    const PAGE_SIZE = 15;

    try {
        const { StreamClient } = await import("@stream-io/node-sdk");
        const client = new StreamClient(process.env.NEXT_PUBLIC_STREAM_API_KEY!, process.env.STREAM_API_SECRET!);
        const { call } = await client.video.call("livestream", streamId).get();
        if (call.created_by.id !== session.user.id) return { status: "error", message: "Unauthorized" };
        manualUserIds = Array.isArray(call.custom?.allowedUserIds) ? call.custom.allowedUserIds.map(String).slice(0, 100) : [];
        page = Math.min(10000, Math.max(1, Math.trunc(page) || 1));
        const paidAccessRecords = await prisma.streamAccess.findMany({
            where: { streamId },
            include: { user: true },
            take: PAGE_SIZE + 1,
            skip: (page - 1) * PAGE_SIZE,
            orderBy: { createdAt: 'desc' }
        });

        const hasMorePaid = paidAccessRecords.length > PAGE_SIZE;
        const recordsToReturn = hasMorePaid ? paidAccessRecords.slice(0, PAGE_SIZE) : paidAccessRecords;

        const paidUsers = recordsToReturn.map(record => ({
            id: record.user.id,
            name: record.user.name,
            image: record.user.image,
            username: record.user.username,
            type: "paid" as const
        }));

        let manualUsers: StreamAccessUser[] = [];
        if (page === 1 && manualUserIds.length > 0) {
            const manualDbUsers = await prisma.user.findMany({
                where: { id: { in: manualUserIds } }
            });

            manualUsers = manualDbUsers.map(u => ({
                id: u.id,
                name: u.name,
                image: u.image,
                username: u.username,
                type: "manual" as const
            }));
        }

        return {
            status: "success",
            message: "Access details fetched",
            data: { paidUsers, manualUsers, hasMorePaid }
        };
    } catch (error) {
        console.error("Failed to get stream access details", error);
        return { status: "error", message: "Failed to fetch details" };
    }
}

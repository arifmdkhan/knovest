"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";

export async function purchaseStreamAccess(streamId: string, price: number) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        // Check if access already exists (double check)
        const existingAccess = await prisma.streamAccess.findUnique({
            where: {
                userId_streamId: {
                    userId: session.user.id,
                    streamId: streamId,
                }
            }
        });

        if (existingAccess) {
            return { success: true, message: "Already purchased" };
        }

        // Mock Payment Processing
        console.log(`Processing payment of ${price} for stream ${streamId} by user ${session.user.id}`);
        // In a real app, integrate Stripe/Razorpay here.

        // Record Access
        await prisma.streamAccess.create({
            data: {
                userId: session.user.id,
                streamId: streamId,
                amount: price,
            }
        });

        // Grant permission on Stream Backend
        try {
            const { StreamClient } = await import("@stream-io/node-sdk");
            const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
            const secret = process.env.STREAM_API_SECRET!;
            const client = new StreamClient(apiKey, secret);

            const call = client.video.call("livestream", streamId);
            // Add user as a member to bypass permission gates for private/group calls
            await call.updateCallMembers({
                update_members: [{ user_id: session.user.id, role: "user" }]
            });
            console.log(`Added user ${session.user.id} to members of stream ${streamId}`);
        } catch (streamError) {
            console.error("Failed to update Stream backend permissions", streamError);
            // Verify if we should rollback DB or just log? 
            // For now, logging is safer than blocking the user if they paid.
        }

        revalidatePath("/trade-room");
        revalidatePath(`/trade-room/${streamId}`);
        return { success: true };

    } catch (error: unknown) {
        console.error("Purchase failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Payment failed";
        return { success: false, error: errorMessage };
    }
}

export async function checkStreamAccess(streamId: string) {
    const session = await getServerSession();
    if (!session?.user) return false;

    const access = await prisma.streamAccess.findUnique({
        where: {
            userId_streamId: {
                userId: session.user.id,
                streamId: streamId,
            }
        }
    });

    return !!access;
}

export async function revokeStreamAccess(streamId: string, userId: string) {
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { StreamClient } = await import("@stream-io/node-sdk");
    const client = new StreamClient(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );

    const call = client.video.call("livestream", streamId);

    // 1. Verify Creator
    const callState = await call.get();
    const creatorId = callState.call.created_by.id;

    if (creatorId !== session.user.id) {
        throw new Error("Only the stream creator can revoke access.");
    }

    // 2. Remove from Stream Members
    await call.updateCallMembers({
        remove_members: [userId]
    });

    // 3. Remove from Database (if exists)
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
    return { success: true };
}

export async function getStreamAccessDetails(streamId: string, manualUserIds: string[], page: number = 1) {
    const session = await getServerSession();
    if (!session?.user) return null;

    const PAGE_SIZE = 15;

    try {
        // 1. Fetch Paid Users from StreamAccess (Paginated)
        console.log(`[getStreamAccessDetails] Fetching for streamId: ${streamId}, page: ${page}`);

        const paidAccessRecords = await prisma.streamAccess.findMany({
            where: { streamId },
            include: { user: true },
            take: PAGE_SIZE + 1, // Fetch one extra to check for hasMore
            skip: (page - 1) * PAGE_SIZE,
            orderBy: { createdAt: 'desc' } // Ensure consistent ordering
        });

        const hasMorePaid = paidAccessRecords.length > PAGE_SIZE;
        const recordsToReturn = hasMorePaid ? paidAccessRecords.slice(0, PAGE_SIZE) : paidAccessRecords;

        console.log(`[getStreamAccessDetails] Found ${recordsToReturn.length} paid records (hasMore: ${hasMorePaid})`);

        const paidUsers = recordsToReturn.map(record => ({
            id: record.user.id,
            name: record.user.name,
            image: record.user.image,
            username: record.user.username,
            type: "paid" as const
        }));

        // 2. Fetch Manual Users Details from User table
        // Only fetch manual users on the first page to avoid redundancy
        let manualUsers: { id: string; name: string | null; image: string | null; username: string | null; type: "manual" }[] = [];
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

        return { paidUsers, manualUsers, hasMorePaid };
    } catch (error) {
        console.error("Failed to get stream access details", error);
        return { paidUsers: [], manualUsers: [], hasMorePaid: false };
    }
}

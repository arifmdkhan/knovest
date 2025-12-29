"use server";

import { prisma } from "@/lib/db";
import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { getServerSession } from "@/lib/get-sessions";

import { ApiResponse } from "@/types/api";

export async function getStreamToken(): Promise<ApiResponse<string>> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!,
            { timeout: 10000 }
        );

        const token = serverClient.createToken(session.user.id);
        return { status: "success", message: "Token generated", data: token };
    } catch (error: any) {
        if (error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        console.error("Get Stream Token Error:", error);
        return { status: "error", message: "Failed to get token" };
    }
}

export async function addMembersToChannel(channelId: string, userIds: string[]): Promise<ApiResponse> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const channel = serverClient.channel('messaging', channelId);

        const channelState = await channel.query({
            watch: false,
            state: true,
        });

        const isGroup = ((channelState.channel as any)?.name) || (channelState.members.length > 2);

        if (isGroup) {
            const creatorId = (channelState.channel as any)?.created_by?.id;
            if (creatorId && creatorId !== session.user.id) {
                return { status: "error", message: "Only the group creator can add members" };
            }
        }

        const members = channelState.members;
        const isMember = members.some(m => m.user_id === session.user.id);

        if (!isMember) {
            return { status: "error", message: "You must be a member of the channel" };
        }

        await channel.addMembers(userIds);
        return { status: "success", message: "Members added" };
    } catch (error) {
        console.error("Add Members Error:", error);
        return { status: "error", message: "Failed to add members" };
    }
}

export async function createDM(targetUserId: string): Promise<ApiResponse<string>> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        const apiSecret = process.env.STREAM_API_SECRET;

        if (!apiKey || !apiSecret) {
            return { status: "error", message: "Server configuration error" };
        }

        const serverClient = StreamChat.getInstance(apiKey, apiSecret);

        const members = Array.from(new Set([session.user.id, targetUserId])).sort();

        if (members.length < 2) {
            return { status: "error", message: "Cannot create DM with yourself" };
        }

        const memberString = members.join('-');
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(memberString).digest('hex');
        const channelId = `dm-${hash.substring(0, 32)}`;

        const channel = serverClient.channel('messaging', channelId, {
            members: members,
            created_by_id: session.user.id
        });

        await channel.create();
        return { status: "success", message: "DM created", data: channelId };
    } catch (error) {
        console.error("createDM Error:", error);
        return { status: "error", message: "Failed to create DM" };
    }
}

export async function toggleModeratorRole(channelId: string, userId: string, isModerator: boolean): Promise<ApiResponse> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const channel = serverClient.channel('messaging', channelId);

        const channelState = await channel.query({
            watch: false,
            state: true,
        });

        const creatorId = (channelState.channel as any)?.created_by?.id;
        if (creatorId !== session.user.id) {
            return { status: "error", message: "Only the group creator can manage roles" };
        }

        if (isModerator) {
            await channel.addModerators([userId]);
        } else {
            await channel.demoteModerators([userId]);
        }

        return { status: "success", message: "Role updated" };
    } catch (error) {
        console.error("Toggle Moderator Role Error:", error);
        return { status: "error", message: "Failed to update role" };
    }
}

export async function deleteStream(type: string, id: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return { status: "error", message: "Unauthorized" };
        }

        const client = new StreamClient(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const calls = await client.video.queryCalls({
            filter_conditions: { id: id },
        });

        if (calls.calls.length === 0) {
            return { status: "error", message: "Stream not found" };
        }

        const call = calls.calls[0];
        const creatorId = (call as any).created_by?.id;

        if (creatorId && creatorId !== session.user.id) {
            return { status: "error", message: "Unauthorized" };
        }

        await client.video.deleteCall({ type, id });
        return { status: "success", message: "Stream deleted" };
    } catch (error) {
        console.error("Delete Stream Error:", error);
        return { status: "error", message: "Failed to delete stream" };
    }
}

export async function createSubscriptionGroup(userId: string, username: string, image?: string | null) {
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );

    const channelId = `subscription-group-${userId}`;

    const channelData: any = {
        name: `SG (@${username})`,
        members: [userId],
        created_by_id: userId,
        demo: "app",
        image: image || undefined,
        isSubscriptionGroup: true,
    };

    const channel = serverClient.channel('messaging', channelId, channelData);

    await channel.create();

    // Ensure name is updated even if channel exists
    await channel.updatePartial({ set: { name: channelData.name, isSubscriptionGroup: true } as any });

    return channelId;
}

export async function removeMemberFromChannel(channelId: string, userId: string) {
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );

    const channel = serverClient.channel('messaging', channelId);

    await channel.removeMembers([userId]);

    return { success: true };
}

export async function addSubscriberToGroup(channelId: string, userId: string) {
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );

    const channel = serverClient.channel('messaging', channelId);

    // Directly add the member without checking if the caller is a member
    // This is safe because it's only called from the server-side confirmSubscription action
    // console.log(`[addSubscriberToGroup] Adding ${userId} to ${channelId}`);
    await channel.addMembers([userId]);
    // console.log(`[addSubscriberToGroup] Added ${userId} to ${channelId}`);

    return { success: true };
}

export async function checkChannelExists(channelId: string) {
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );

    const channels = await serverClient.queryChannels({
        id: { $eq: channelId },
    });

    return channels.length > 0;
}

export async function syncStreamUser(
    userId: string,
    data: {
        name?: string;
        username?: string;
        image?: string;
        expertVerificationType?: string | null;
        accountVerificationType?: string | null;
    }
): Promise<ApiResponse> {
    try {
        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const updateData: any = { id: userId };

        if (data.name) updateData.name = data.name;
        if (data.image) updateData.image = data.image;
        if (data.username) updateData.username = data.username;
        if (data.expertVerificationType !== undefined) updateData.expertVerificationType = data.expertVerificationType;
        if (data.accountVerificationType !== undefined) updateData.accountVerificationType = data.accountVerificationType;

        // console.log(`[syncStreamUser] Syncing user ${userId} to Stream`, updateData);
        await serverClient.upsertUser(updateData);
        return { status: "success", message: "User synced" };
    } catch (error) {
        console.error("Sync Stream User Error:", error);
        return { status: "error", message: "Failed to sync user" };
    }
}

export async function restoreStreamUsers(userIds: string[]): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user) return { status: "error", message: "Unauthorized" };

        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        // console.log(`[restoreStreamUsers] Restoring users:`, userIds);
        await serverClient.restoreUsers(userIds);
        return { status: "success", message: "Users restored" };
    } catch (error) {
        console.error("Restore Stream Users Error:", error);
        return { status: "error", message: "Failed to restore users" };
    }
}

export async function syncAllUsersToStream(): Promise<ApiResponse<{ count: number }>> {
    try {
        const session = await getServerSession();
        if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
            return { status: "error", message: "Unauthorized" };
        }

        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        let page = 0;
        const batchSize = 100;
        let processedCount = 0;

        while (true) {
            const users = await prisma.user.findMany({
                skip: page * batchSize,
                take: batchSize,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    expertVerificationType: true,
                    accountVerificationType: true,
                }
            });

            if (users.length === 0) break;

            const usersToSync = users.map(u => ({
                id: u.id,
                name: u.name,
                image: u.image || undefined,
                username: u.username || undefined,
                expertVerificationType: u.expertVerificationType || undefined,
                accountVerificationType: u.accountVerificationType || undefined,
            }));

            // console.log(`[syncAllUsersToStream] Syncing batch ${page + 1} (${users.length} users)`);
            await serverClient.upsertUsers(usersToSync);

            processedCount += users.length;
            page++;
        }

        return { status: "success", message: "All users synced", data: { count: processedCount } };

    } catch (error) {
        console.error("Sync All Users Error:", error);
        return { status: "error", message: "Failed to sync users" };
    }
}
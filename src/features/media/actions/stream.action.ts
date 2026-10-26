"use server";

import { prisma } from "@/lib/db";
import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { z } from "zod";
import { getServerSession } from "@/lib/get-sessions";
import { ApiResponse } from "@/types/api";

import { safeAction } from "@/lib/safe-action";

const GetStreamTokenSchema = z.object({});

const AddMembersSchema = z.object({
    channelId: z.string().min(1),
    userIds: z.array(z.string().min(1)).min(1).max(100),
});

const CreateDMSchema = z.object({
    targetUserId: z.string().min(1),
});

const ToggleModeratorSchema = z.object({
    channelId: z.string().min(1),
    userId: z.string().min(1),
    isModerator: z.boolean(),
});

const DeleteStreamSchema = z.object({
    type: z.string().refine((value): boolean => value === "livestream" || value === "audio_room"),
    id: z.string().min(1),
});


const RestoreStreamUsersSchema = z.object({
    userIds: z.array(z.string().min(1)),
});

const EmptySchema = z.object({});



export const getStreamToken = safeAction(
    GetStreamTokenSchema,
    async (_, { user }) => {
        if (process.env.NODE_ENV === "production" && process.env.STREAM_PERMISSIONS_VERIFIED !== "true") {
            return { status: "error", message: "Live connections are not enabled for this release" };
        }
        try {
            const serverClient = StreamChat.getInstance(
                process.env.NEXT_PUBLIC_STREAM_API_KEY!,
                process.env.STREAM_API_SECRET!,
                { timeout: 10000 }
            );

            const now = Math.floor(Date.now() / 1000);
            // Stream rejects future iat claims even for small server clock skew.
            // Keep iat for revocation, with a bounded allowance; expiry stays four hours.
            const token = serverClient.createToken(user!.id, now + 4 * 60 * 60, now - 60);
            return { status: "success", message: "Token generated", data: token };
        } catch (error: any) {
            if (error.digest === 'DYNAMIC_SERVER_USAGE') {
                throw error;
            }
            console.error("Get Stream Token Error:", error);
            return { status: "error", message: "Failed to get token" };
        }
    },
    { requiredRole: "USER" }
);

export const addMembersToChannel = safeAction(
    AddMembersSchema,
    async ({ channelId, userIds }, { user }) => {
        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const channel = serverClient.channel('messaging', channelId);
        const channelState = await channel.query({ watch: false, state: true });

        if (channelId.startsWith("subscription-group-") || channelState.channel?.created_by?.id !== user!.id) {
            return { status: "error", message: "Only the group creator can add members to ordinary groups" };
        }

        const members = channelState.members;
        const isMember = members.some(m => m.user_id === user!.id);

        if (!isMember) {
            return { status: "error", message: "You must be a member of the channel" };
        }

        await channel.addMembers(userIds);
        return { status: "success", message: "Members added" };
    },
    { requiredRole: "USER" }
);

export const createDM = safeAction(
    CreateDMSchema,
    async ({ targetUserId }, { user }) => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
        const apiSecret = process.env.STREAM_API_SECRET!;
        const serverClient = StreamChat.getInstance(apiKey, apiSecret);

        const members = Array.from(new Set([user!.id, targetUserId])).sort();

        if (members.length < 2) {
            return { status: "error", message: "Cannot create DM with yourself" };
        }

        const memberString = members.join('-');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(memberString).digest('hex');
        const channelId = `dm-${hash.substring(0, 32)}`;

        const channel = serverClient.channel('messaging', channelId, {
            members: members,
            created_by_id: user!.id
        });

        await channel.create();
        return { status: "success", message: "DM created", data: channelId };
    },
    { requiredRole: "USER" }
);

export const toggleModeratorRole = safeAction(
    ToggleModeratorSchema,
    async ({ channelId, userId, isModerator }, { user }) => {
        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const channel = serverClient.channel('messaging', channelId);
        const channelState = await channel.query({ watch: false, state: true });

        const creatorId = (channelState.channel as any)?.created_by?.id;
        if (creatorId !== user!.id) {
            return { status: "error", message: "Only the group creator can manage roles" };
        }

        if (isModerator) {
            await channel.addModerators([userId]);
        } else {
            await channel.demoteModerators([userId]);
        }

        return { status: "success", message: "Role updated" };
    },
    { requiredRole: "USER" }
);

export const deleteStream = safeAction(
    DeleteStreamSchema,
    async ({ type, id }, { user }) => {
        const client = new StreamClient(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const { call } = await client.video.call(type, id).get();
        if (call.created_by?.id !== user!.id) {
            return { status: "error", message: "Unauthorized" };
        }

        await client.video.deleteCall({ type, id });
        return { status: "success", message: "Stream deleted" };
    },
    { requiredRole: "USER" }
);



export async function syncStreamUser(
    userId: string,
    _data?: {
        name?: string;
        username?: string;
        image?: string;
        expertVerificationType?: string | null;
        accountVerificationType?: string | null;
    }
): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
    

        if (!session?.user) return { status: "error", message: "Unauthorized" };

        if (session.user.id !== userId && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            return { status: "error", message: "Unauthorized: Cannot sync other users" };
        }

        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        const canonical = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            select: { id: true, name: true, image: true, username: true, expertVerificationType: true, accountVerificationType: true },
        });
        if (!canonical) return { status: "error", message: "User not found" };
        await serverClient.upsertUser({ ...canonical, image: canonical.image || undefined, username: canonical.username || undefined });
        return { status: "success", message: "User synced" };
    } catch (error) {
        console.error("Sync Stream User Error:", error);
        return { status: "error", message: "Failed to sync user" };
    }
}

export const restoreStreamUsers = safeAction(
    RestoreStreamUsersSchema,
    async ({ userIds }) => {
        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );
        await serverClient.restoreUsers(userIds);
        return { status: "success", message: "Users restored" };
    },
    { requiredRole: "ADMIN" } // Restricted to Admin
);

export const syncAllUsersToStream = safeAction(
    EmptySchema,
    async () => {
        const serverClient = StreamChat.getInstance(
            process.env.NEXT_PUBLIC_STREAM_API_KEY!,
            process.env.STREAM_API_SECRET!
        );

        let page = 0;
        const batchSize = 100;
        let processedCount = 0;

        // eslint-disable-next-line no-constant-condition
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

            await serverClient.upsertUsers(usersToSync);
            processedCount += users.length;
            page++;
        }

        return { status: "success", message: "All users synced", data: { count: processedCount } };
    },
    { requiredRole: "ADMIN" }
);

import "server-only";
import { StreamChat } from "stream-chat";

export async function createSubscriptionGroup(userId: string, username: string, image?: string | null) {
   
    return createSubscriptionGroup_Internal(userId, username, image);
}


async function createSubscriptionGroup_Internal(userId: string, username: string, image?: string | null) {
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
    await channel.updatePartial({ set: { name: channelData.name, isSubscriptionGroup: true } as any });
    return channelId;
}


export async function removeMemberFromChannel(channelId: string, userId: string) {


    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );
    const channel = serverClient.channel('messaging', channelId);
    await channel.removeMembers([userId]);
    return { success: true };
}

export async function addSubscriberToGroup(channelId: string, userId: string) {
    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );
    const channel = serverClient.channel('messaging', channelId);
    await channel.addMembers([userId]);
    return { success: true };
}

export async function checkChannelExists(channelId: string) {
    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!
    );
    const channels = await serverClient.queryChannels({ id: { $eq: channelId } });
    return channels.length > 0;
}



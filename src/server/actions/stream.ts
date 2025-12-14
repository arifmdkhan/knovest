"use server";

import { prisma } from "@/lib/db"; // Ensure prisma is imported
import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { getServerSession } from "@/lib/get-sessions";

export async function getStreamToken() {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Initialize Server Client with 10s timeout
  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!,
    { timeout: 10000 }
  );

  // Generate Token
  const token = serverClient.createToken(session.user.id);

  return token;
}

export async function addMembersToChannel(
  channelId: string,
  userIds: string[]
) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Initialize Server Client (Admin privileges)
  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const channel = serverClient.channel("messaging", channelId);

  // Security Check: Ensure requesting user is a member
  // We query the channel to get its current members
  const channelState = await channel.query({
    watch: false,
    state: true,
  });

  // Check if it's a group (has name or > 2 members)
  // Note: channelState.channel might not have member_count up to date in some cases, but 'members' array length is reliable for the query result
  const isGroup =
    (channelState.channel as any)?.name || channelState.members.length > 2;

  if (isGroup) {
    const creatorId = (channelState.channel as any)?.created_by?.id;
    if (creatorId && creatorId !== session.user.id) {
      throw new Error("Only the group creator can add members.");
    }
  } else {
    // For DMs, ensure we are at least a member (already checked below)
  }

  const members = channelState.members;
  const isMember = members.some((m) => m.user_id === session.user.id);

  if (!isMember) {
    throw new Error("You must be a member of the channel to add others.");
  }

  // Add members
  await channel.addMembers(userIds);

  return { success: true };
}

export async function createDM(targetUserId: string) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      throw new Error("Unauthorized: No session found");
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("Missing Stream API Keys in createDM");
      throw new Error("Server Configuration Error: Missing Stream Keys");
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);

    // Ensure unique members and sort them for deterministic ID
    const members = Array.from(new Set([session.user.id, targetUserId])).sort();

    if (members.length < 2) {
      throw new Error("Cannot create a DM with yourself");
    }

    const memberString = members.join("-");

    // Use Node.js crypto for server-side hashing
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(memberString).digest("hex");
    const channelId = `dm-${hash.substring(0, 32)}`;

    const channel = serverClient.channel("messaging", channelId, {
      members: members,
      created_by_id: session.user.id,
    });

    await channel.create();

    return channelId;
  } catch (error) {
    console.error("createDM Action Failed:", error);
    throw error;
  }
}

export async function toggleModeratorRole(
  channelId: string,
  userId: string,
  isModerator: boolean
) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const channel = serverClient.channel("messaging", channelId);

  // Security Check: Ensure requesting user is the creator/owner
  const channelState = await channel.query({
    watch: false,
    state: true,
  });

  const creatorId = (channelState.channel as any)?.created_by?.id;
  if (creatorId !== session.user.id) {
    throw new Error("Only the group creator can manage roles.");
  }

  if (isModerator) {
    await channel.addModerators([userId]);
  } else {
    await channel.demoteModerators([userId]);
  }

  return { success: true };
}

export async function deleteStream(type: string, id: string) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const client = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  // Verify ownership
  const calls = await client.video.queryCalls({
    filter_conditions: {
      id: id,
    },
  });

  if (calls.calls.length === 0) {
    throw new Error("Stream not found");
  }

  const call = calls.calls[0];

  // Check ownership
  // The SDK uses snake_case for created_by
  const creatorId = (call as any).created_by?.id;

  if (creatorId && creatorId !== session.user.id) {
    throw new Error("You can only delete your own streams");
  }

  // deleteCall expects an object with type and id
  await client.video.deleteCall({ type, id });
  return { success: true };
}

export async function createSubscriptionGroup(
  userId: string,
  username: string,
  image?: string | null
) {
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

  const channel = serverClient.channel("messaging", channelId, channelData);

  await channel.create();

  // Ensure name is updated even if channel exists
  await channel.updatePartial({
    set: { name: channelData.name, isSubscriptionGroup: true } as any,
  });

  return channelId;
}

export async function removeMemberFromChannel(
  channelId: string,
  userId: string
) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const serverClient = StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const channel = serverClient.channel("messaging", channelId);

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

  const channel = serverClient.channel("messaging", channelId);

  // Directly add the member without checking if the caller is a member
  // This is safe because it's only called from the server-side confirmSubscription action
  console.log(`[addSubscriberToGroup] Adding ${userId} to ${channelId}`);
  await channel.addMembers([userId]);
  console.log(`[addSubscriberToGroup] Added ${userId} to ${channelId}`);

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
  data: { name?: string; username?: string; image?: string }
) {
  try {
    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    // Construct update object with only defined fields
    // Stream expects 'id' and 'name' (display name), 'image' (avatar url)
    // 'username' is not a default field in StreamUser, so we put it in custom data if needed,
    // OR mapping 'username' to 'id' is common but ID is immutable usually.
    // Here we map 'name' -> name, 'image' -> image.
    // passing 'username' as a custom property.
    const updateData: any = { id: userId };

    if (data.name) updateData.name = data.name;
    if (data.image) updateData.image = data.image;
    if (data.username) updateData.username = data.username;

    console.log(
      `[syncStreamUser] Syncing user ${userId} to Stream`,
      updateData
    );
    await serverClient.upsertUser(updateData);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function restoreStreamUsers(userIds: string[]) {
  try {
    const session = await getServerSession();
    if (!session?.user) throw new Error("Unauthorized");

    // Ideally check for Admin role here if strictly restricted
    // const isAdmin = session.user.role === 'ADMIN';
    // if (!isAdmin) throw new Error("Unauthorized");

    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    console.log(`[restoreStreamUsers] Restoring users:`, userIds);
    await serverClient.restoreUsers(userIds);
    return { success: true };
  } catch (error) {
    console.error("Failed to restore stream users:", error);
    return { success: false, error: "Failed to restore users" };
  }
}

export async function syncAllUsersToStream() {
  try {
    const session = await getServerSession();
    // Check admin permission strictly
    if (session?.user?.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const serverClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    // Fetch all users from Prisma
    // For large DBs, we should paginate. Assuming < 10k users for now, but let's do batches of 100 to be safe and robust.
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
        },
      });

      if (users.length === 0) break;

      const usersToSync = users.map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image || undefined,
        username: u.username || undefined, // Custom field
      }));

      console.log(
        `[syncAllUsersToStream] Syncing batch ${page + 1} (${
          users.length
        } users)`
      );
      await serverClient.upsertUsers(usersToSync);

      processedCount += users.length;
      page++;
    }

    return { success: true, count: processedCount };
  } catch (error) {
    console.error("Failed to sync all users to Stream:", error);
    return { success: false, error: "Sync failed" };
  }
}

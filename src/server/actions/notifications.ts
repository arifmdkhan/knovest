"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";

export async function getNotifications(page: number = 1, limit: number = 20) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { status: "error", message: "Unauthorized", data: [] };

        const fetchLimit = limit * 3; // Fetch more to allow for grouping
        const skip = (page - 1) * limit; // Simple pagination for now (offset based on original items)

        const rawNotifications = await prisma.notification.findMany({
            where: { recipientId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: fetchLimit,
            skip: skip,
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
        });

        // Grouping Logic
        const groupedMap = new Map();
        const result: any[] = [];

        for (const notif of rawNotifications) {
            // Key for grouping: Type + EntityId (if exists) + Date (Day)
            // Grouping by Day ensures we don't aggregate "Liked your post" from 2 years ago with one from today if we want to separate them.
            // For now, let's group purely by Type + EntityId for simplicity, or add a time window check.
            const dateKey = notif.createdAt.toDateString();
            const key = notif.entityId
                ? `${notif.type}-${notif.entityId}-${dateKey}`
                : notif.id; // unique key if no entityId (don't group)

            if (notif.entityId && (notif.type === "LIKE" || notif.type === "REPOST" || notif.type === "COMMENT")) {
                if (!groupedMap.has(key)) {
                    const groupItem = {
                        ...notif,
                        actors: notif.actor ? [notif.actor] : [], // Initialize array
                        count: 1,
                        isRead: notif.isRead // Will be false if ANY in group is false
                    };
                    groupedMap.set(key, groupItem);
                    result.push(groupItem);
                } else {
                    const group = groupedMap.get(key);
                    if (notif.actor) {
                        // Avoid duplicate actors in the list if user spams action? (Should handle in logic)
                        if (!group.actors.find((a: any) => a.id === notif.actor?.id)) {
                            group.actors.push(notif.actor);
                        }
                    }
                    group.count += 1;
                    if (!notif.isRead) group.isRead = false; // Mark group as unread if new item is unread
                    // Update timestamp to most recent? (Already is, since we iterate desc)
                }
            } else {
                // Don't group strictly unique types like FOLLOW (unless we want "User A and B followed you") or SYSTEM
                // Actually FOLLOW can be grouped too.
                if (notif.type === "FOLLOW") {
                    // Group follows by day
                    const followKey = `FOLLOW-${dateKey}`;
                    if (!groupedMap.has(followKey)) {
                        const groupItem = {
                            ...notif,
                            actors: notif.actor ? [notif.actor] : [],
                            count: 1,
                            entityId: null
                        };
                        groupedMap.set(followKey, groupItem);
                        result.push(groupItem);
                    } else {
                        const group = groupedMap.get(followKey);
                        if (notif.actor && !group.actors.find((a: any) => a.id === notif.actor?.id)) {
                            group.actors.push(notif.actor);
                        }
                        group.count += 1;
                        if (!notif.isRead) group.isRead = false;
                    }
                } else {
                    // Default: No grouping
                    result.push({
                        ...notif,
                        actors: notif.actor ? [notif.actor] : [],
                        count: 1
                    });
                }
            }
        }

        // Slice to limit to respect pagination roughly
        const slicedResult = result.slice(0, limit);

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { recipientId: session.user.id, isRead: false },
        });

        return { status: "success", data: slicedResult, unreadCount };
    } catch (error) {
        console.error("Get Notifications Error:", error);
        return { status: "error", message: "Failed to fetch notifications", data: [] };
    }
}

export async function markAsRead(notificationId?: string) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { status: "error", message: "Unauthorized" };

        if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId, recipientId: session.user.id },
                data: { isRead: true },
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { recipientId: session.user.id, isRead: false },
                data: { isRead: true },
            });
        }

        revalidatePath("/notifications");
        return { status: "success" };
    } catch (error) {
        console.error("Mark Read Error:", error);
        return { status: "error", message: "Failed to update notification" };
    }
}

// Internal helper to create notification
export async function createNotification({
    recipientId,
    actorId,
    type,
    entityId,
    message
}: {
    recipientId: string;
    actorId?: string;
    type: "LIKE" | "FOLLOW" | "COMMENT" | "REPLY" | "SYSTEM" | "MENTION" | "REPOST";
    entityId?: string;
    message?: string;
}) {
    // Skip self-notification check for SYSTEM type
    if (type !== "SYSTEM" && recipientId === actorId) {
        console.log("createNotification: Skipped (Self-notification)", { recipientId, actorId });
        return;
    }

    try {
        console.log("createNotification: Attempting to create", { recipientId, actorId, type, entityId });
        const notif = await prisma.notification.create({
            data: {
                recipientId,
                actorId, // Can be undefined for SYSTEM
                type,
                entityId,
                message
            }
        });
        console.log("createNotification: Success", notif.id);
    } catch (error) {
        console.error("Create Notification Error:", error);
    }
}


export async function getUnreadCount() {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { count: 0 };

        const count = await prisma.notification.count({
            where: {
                recipientId: session.user.id,
                isRead: false
            },
        });

        return { count };
    } catch (error) {
        return { count: 0 };
    }
}

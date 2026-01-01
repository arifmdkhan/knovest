"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";

export async function getNotifications(page: number = 1, limit: number = 20): Promise<ApiResponse<{ data: any[]; unreadCount: number }>> {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { status: "error", message: "Unauthorized" };

        const fetchLimit = limit * 3;
        const skip = (page - 1) * limit;

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

        type NotificationWithActor = typeof rawNotifications[0];

        interface NotificationGroup extends Omit<NotificationWithActor, 'actor'> {
            actors: NonNullable<NotificationWithActor['actor']>[];
            count: number;
            isRead: boolean;
            entityId: string | null;
        }

        const groupedMap = new Map<string, NotificationGroup>();
        const result: NotificationGroup[] = [];

        for (const notif of rawNotifications) {
            const dateKey = notif.createdAt.toDateString();
            const key = notif.entityId
                ? `${notif.type}-${notif.entityId}-${dateKey}`
                : notif.id;

            if (notif.entityId && (notif.type === "LIKE" || notif.type === "REPOST" || notif.type === "COMMENT")) {
                if (!groupedMap.has(key)) {
                    const groupItem: NotificationGroup = {
                        ...notif,
                        actors: notif.actor ? [notif.actor] : [],
                        count: 1,
                        isRead: notif.isRead,
                        entityId: notif.entityId
                    };
                    groupedMap.set(key, groupItem);
                    result.push(groupItem);
                } else {
                    const group = groupedMap.get(key)!;
                    if (notif.actor) {
                        if (!group.actors.find((a) => a.id === notif.actor?.id)) {
                            group.actors.push(notif.actor);
                        }
                    }
                    group.count += 1;
                    if (!notif.isRead) group.isRead = false;
                }
            } else {
                if (notif.type === "FOLLOW") {
                    const followKey = `FOLLOW-${dateKey}`;
                    if (!groupedMap.has(followKey)) {
                        const groupItem: NotificationGroup = {
                            ...notif,
                            actors: notif.actor ? [notif.actor] : [],
                            count: 1,
                            entityId: null,
                            isRead: notif.isRead
                        };
                        groupedMap.set(followKey, groupItem);
                        result.push(groupItem);
                    } else {
                        const group = groupedMap.get(followKey)!;
                        if (notif.actor && !group.actors.find((a) => a.id === notif.actor?.id)) {
                            group.actors.push(notif.actor);
                        }
                        group.count += 1;
                        if (!notif.isRead) group.isRead = false;
                    }
                } else {
                    result.push({
                        ...notif,
                        actors: notif.actor ? [notif.actor] : [],
                        count: 1,
                        entityId: notif.entityId,
                        isRead: notif.isRead
                    });
                }
            }
        }

        const slicedResult = result.slice(0, limit);

        const unreadCount = await prisma.notification.count({
            where: { recipientId: session.user.id, isRead: false },
        });

        return { status: "success", message: "Notifications fetched successfully", data: { data: slicedResult, unreadCount } };
    } catch (error) {
        console.error("Get Notifications Error:", error);
        return { status: "error", message: "Failed to fetch notifications" };
    }
}

export async function markAsRead(notificationId?: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { status: "error", message: "Unauthorized" };

        if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId, recipientId: session.user.id },
                data: { isRead: true },
            });
        } else {
            await prisma.notification.updateMany({
                where: { recipientId: session.user.id, isRead: false },
                data: { isRead: true },
            });
        }

        revalidatePath("/notifications");
        return { status: "success", message: "Notifications marked as read" };
    } catch (error) {
        console.error("Mark Read Error:", error);
        return { status: "error", message: "Failed to update notification" };
    }
}

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
    if (type !== "SYSTEM" && recipientId === actorId) {
        return;
    }

    try {
        await prisma.notification.create({
            data: {
                recipientId,
                actorId,
                type,
                entityId,
                message
            }
        });
    } catch (error) {
        console.error("Create Notification Error:", error);
    }
}

export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { status: "success", message: "Unauthorized", data: { count: 0 } };

        const count = await prisma.notification.count({
            where: {
                recipientId: session.user.id,
                isRead: false
            },
        });

        return { status: "success", message: "Unread count fetched successfully", data: { count } };
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        return { status: "error", message: "Failed to fetch unread count" };
    }
}

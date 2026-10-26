import "server-only";
import { prisma } from "@/lib/db";

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


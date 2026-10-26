"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { safeAction } from "@/lib/safe-action";

export const getRoomHosts = safeAction(
    z.object({ userIds: z.array(z.string().min(1).max(128)).max(50) }),
    async ({ userIds }) => {
        const users = await prisma.user.findMany({
            where: { id: { in: [...new Set(userIds)] }, banned: false },
            select: { id: true, name: true, username: true, image: true, expertVerificationType: true, accountVerificationType: true },
        });
        return { status: "success", message: "Hosts loaded", data: users };
    },
    { requiredRole: "USER" },
);

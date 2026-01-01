"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";

export async function getMySubscriptions() {
    const user = await requireUser();

    const subscriptions = await prisma.subscription.findMany({
        where: {
            subscriberId: user.id,
            status: "ACTIVE"
        },
        select: {
            id: true,
            subscribedTo: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    expertVerificationType: true,
                    accountVerificationType: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return subscriptions;
}

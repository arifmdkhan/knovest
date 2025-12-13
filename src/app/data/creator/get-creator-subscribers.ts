import "server-only";

import { prisma } from "@/lib/db";
import { requireCreator } from "./require-creator";

export async function getCreatorSubscribers() {
    const session = await requireCreator();
    const user = session.user;

    const subscribers = await prisma.subscription.findMany({
        where: {
            subscribedToId: user.id,
            status: "ACTIVE",
        },
        include: {
            subscriber: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return subscribers.map((sub) => ({
        id: sub.subscriber.id,
        name: sub.subscriber.name,
        username: sub.subscriber.username,
        email: sub.subscriber.email,
        image: sub.subscriber.image,
        subscriptionDate: sub.createdAt,
    }));
}

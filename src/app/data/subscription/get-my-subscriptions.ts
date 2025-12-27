import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";

export async function getMySubscriptions() {
    const session = await getServerSession();
    const userId = session?.user?.id;

    if (!userId) {
        return [];
    }

    const subscriptions = await prisma.subscription.findMany({
        where: {
            subscriberId: userId,
            status: 'ACTIVE',
        },
        include: {
            subscribedTo: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    expertVerificationType: true,
                    accountVerificationType: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return subscriptions;
}

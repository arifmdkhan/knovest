"use server";

import { requireUser } from "@/server/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { redirect } from "next/navigation";

export async function subscribeAction(
    creatorId: string
): Promise<ApiResponse | never> {
    const user = await requireUser();
    let checkoutUrl: string | undefined;

    try {
        if (user.id === creatorId) {
            return {
                status: "error",
                message: "You cannot subscribe to yourself",
            };
        }

        const creator = await prisma.user.findUnique({
            where: { id: creatorId },
            select: {
                id: true,
                isSubscriptionEnabled: true,
                subscriptionPrice: true,
            },
        });

        if (!creator || !creator.isSubscriptionEnabled) {
            return {
                status: "error",
                message: "This user has not enabled subscriptions",
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            const existingSubscription = await tx.subscription.findUnique({
                where: {
                    subscriberId_subscribedToId: {
                        subscriberId: user.id,
                        subscribedToId: creator.id,
                    },
                },
            });

            if (existingSubscription?.status === "ACTIVE") {
                return {
                    status: "success" as const,
                    message: "You are already subscribed to this user",
                };
            }

            if (existingSubscription) {
                await tx.subscription.update({
                    where: { id: existingSubscription.id },
                    data: {
                        status: "PENDING",
                        updatedAt: new Date(),
                    },
                });
            } else {
                await tx.subscription.create({
                    data: {
                        subscriberId: user.id,
                        subscribedToId: creator.id,
                        status: "PENDING",
                    },
                });
            }

            return {
                checkoutUrl: `/subscription/payment?creatorId=${creator.id}`,
            };
        });

        if ("status" in result && result.status === "success") {
            return result as ApiResponse;
        }

        checkoutUrl = (result as { checkoutUrl: string }).checkoutUrl;

    } catch (error) {
        console.error("Subscribe Action Error:", error);
        return {
            status: "error",
            message: "Failed to initiate subscription",
        };
    }

    if (!checkoutUrl) {
        return {
            status: "error",
            message: "Failed to generate checkout URL",
        };
    }

    redirect(checkoutUrl);
}

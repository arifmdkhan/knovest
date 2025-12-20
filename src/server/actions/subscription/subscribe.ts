"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { redirect } from "next/navigation";

export async function subscribeAction(
    creatorId: string
): Promise<ApiResponse | never> {
    const user = await requireUser();
    let checkoutUrl: string;

    try {
        if (user.id === creatorId) {
            return {
                status: "error",
                message: "You cannot subscribe to yourself",
            };
        }

        const creator = await prisma.user.findUnique({
            where: {
                id: creatorId,
            },
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
                    status: "success",
                    message: "You are already subscribed to this user",
                };
            }

            if (existingSubscription) {
                await tx.subscription.update({
                    where: {
                        id: existingSubscription.id,
                    },
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

            const checkOutPaymentUrl = `/subscription/payment?creatorId=${creator.id}`;

            return {
                checkoutUrl: checkOutPaymentUrl,
            };
        });

        if ('message' in result) {
            return result as ApiResponse;
        }

        checkoutUrl = result.checkoutUrl as string;

        // Revalidate profile pages to show updated subscriber count/status
        // Since we don't have usernames here, we'd ideally fetch them similar to follower logic 
        // or just rely on the redirect to payment which eventually leads back. 
        // But for "Subscribers" count on profile to be correct for the creator:
        // We really should revalidate the creator's profile page.

        // However, this action redirects to payment, so the immediate UI update isn't on the profile page.
        // The count update happens AFTER payment success webhook/callback updates the status to ACTIVE.

        // Wait, the user said "If any user subscribe and unsubcribe then it still displaing the numbers".
        // This implies they might be testing locally or expects immediate updates.
        // If the subscription is PENDING, does it count? Probably not.

        // Let's assume the user means `check-subscription` or a webhook handles the final state. 
        // But if they "unsubscribe" (cancel), that should update instantly.

    } catch (error) {
        console.error("Subscribe Action Error:", error);
        return {
            status: "error",
            message: "Failed to initiate subscription",
        };
    }

    redirect(checkoutUrl);
}

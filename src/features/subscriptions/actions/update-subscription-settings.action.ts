"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSubscriptionSettingsSchema = z.object({
  isSubscriptionEnabled: z.boolean(),
  subscriptionPrice: z.number().min(0, "Price must be positive"),
});

export type UpdateSubscriptionSettingsType = z.infer<typeof updateSubscriptionSettingsSchema>;

export async function updateSubscriptionSettings(
  data: UpdateSubscriptionSettingsType
): Promise<ApiResponse> {
  try {
    const sessionUser = await requireUser();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        username: true,
        image: true,
        expertVerificationType: true,
        accountVerificationType: true,
        subscriptionChannelId: true,
      }
    });

    if (!user) {
      return {
        status: "error",
        message: "User not found",
      };
    }

    if (!user.expertVerificationType) {
      return {
        status: "error",
        message: "Only expert users can enable subscriptions",
      };
    }

    const parsed = updateSubscriptionSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    if (parsed.data.subscriptionPrice > 0) return { status: "error", message: "Paid subscriptions are disabled for this release. Set the price to zero." };

    let subscriptionChannelId = user.subscriptionChannelId;

    // Check if we need to create a subscription group
    if (parsed.data.isSubscriptionEnabled) {
      let shouldCreate = !subscriptionChannelId;

      // If we have an ID, verify it actually exists in Stream (it might have been deleted)
      if (subscriptionChannelId) {
        try {
          const { checkChannelExists } = await import("@/features/media/services/subscription-channel");
          const exists = await checkChannelExists(subscriptionChannelId);
          if (!exists) {
            shouldCreate = true;
          }
        } catch (error) {
          console.error("Failed to check channel existence:", error);

        }
      }

      if (shouldCreate) {
        try {
          const { createSubscriptionGroup } = await import("@/features/media/services/subscription-channel");
          subscriptionChannelId = await createSubscriptionGroup(user.id, user.username || "User", user.image);
        } catch (error) {
          console.error("Failed to create subscription group:", error);
        }
      }
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isSubscriptionEnabled: parsed.data.isSubscriptionEnabled,
        subscriptionPrice: parsed.data.subscriptionPrice,
        subscriptionChannelId: subscriptionChannelId,
      },
    });

    revalidatePath("/settings");
    revalidatePath(`/profile/${user.username}`);

    return {
      status: "success",
      message: "Subscription settings updated",
    };
  } catch (error) {
    console.error("Update Subscription Settings Error:", error);
    return {
      status: "error",
      message: "Failed to update settings",
    };
  }
}

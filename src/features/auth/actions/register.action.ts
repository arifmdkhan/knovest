"use server";

import { prisma } from "@/lib/db";
import { syncStreamUser } from "@/features/media/actions/stream.action";
import { safeAction } from "@/lib/safe-action";
import { z } from "zod";

const UsernameCheckSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
});

export const checkUsernameAvailability = safeAction(
  UsernameCheckSchema,
  async ({ username }, { user }) => {
    try {

      const existingUser = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
      });

      if (existingUser && existingUser.id !== user?.id) {
        return { status: "error", message: "Username is already taken" };
      }

      return { status: "success", message: "Username is available", data: true };
    } catch (error) {
      console.error("Check Username Error:", error);
      return { status: "error", message: "Failed to validate username" };
    }
  },
  {} // Public access
);

const UpdateProfileLoginSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
});

export const updateProfileAfterLogin = safeAction(
  UpdateProfileLoginSchema,
  async (data, { user }) => {
    // Re-check availability within the action to prevent race conditions or bypass
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase() }
    });

    if (existingUser && existingUser.id !== user!.id) {
      return { status: "error", message: "Username is already taken" };
    }

    await prisma.user.update({
      where: { id: user!.id },
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        displayUsername: data.username
      }
    });

    await syncStreamUser(user!.id, {
      name: data.name,
      username: data.username
    });

    return { status: "success", message: "Profile updated" };
  },
  { requiredRole: "USER" }
);

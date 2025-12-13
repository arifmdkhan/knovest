"use server";

import { prisma } from "@/lib/db";

import { ApiResponse } from "@/lib/types";
import { getServerSession } from "@/lib/get-sessions";


// --- Action: Check Username Availability ---
export async function checkUsernameAvailability(username: string): Promise<ApiResponse<boolean>> {
  try {
    const isValidFormat = /^[a-zA-Z0-9_]+$/.test(username);
    if (!isValidFormat) {
      return { status: "error", message: "Username can only contain letters, numbers, and underscores" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (existingUser) {
      return { status: "error", message: "Username is already taken" };
    }

    return { status: "success", message: "Username is available", data: true };
  } catch (error) {
    return { status: "error", message: "Failed to validate username" };
  }
}

// --- Action: Update Profile After OTP Login ---
export async function updateProfileAfterLogin(data: { name: string, username: string }): Promise<ApiResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return { status: "error", message: "Unauthorized" };
    }

    // Double check username availability to be safe
    const check = await checkUsernameAvailability(data.username);
    if (check.status === 'error') return check;

    // Update via Prisma to ensure we hit the unique fields correctly
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        displayUsername: data.username
      }
    });

    return { status: "success", message: "Profile updated" };
  } catch (error: any) {
    return { status: "error", message: error.message || "Failed to update profile" };
  }
}
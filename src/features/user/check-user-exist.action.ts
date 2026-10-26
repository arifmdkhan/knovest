"use server";

import "server-only";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";

export async function checkUserExists(email: string): Promise<ApiResponse<boolean>> {
  try {

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return { status: "error", message: "User not found" };
    }

    return { status: "success", message: "User exists", data: true };
  } catch (error) {
    console.error("Check User Error:", error);
    return { status: "error", message: "Failed to check user status" };
  }
}


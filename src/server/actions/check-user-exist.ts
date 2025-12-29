"use server";

import "server-only";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import arcjet, { detectBot, slidingWindow, request } from "@arcjet/next";

export async function checkUserExists(email: string): Promise<ApiResponse<boolean>> {
  try {
    // Basic rate limiting/bot detection for sensitive endpoint
    // Remove characteristics to rely on default IP fingerprinting
    const aj = arcjet({
      key: process.env.ARCJET_KEY!,
      rules: [
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE"],
        }),
        slidingWindow({
          mode: "LIVE",
          interval: "10m",
          max: 10,
        })
      ]
    });

    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return { status: "error", message: "Too many requests. Please try again later." };
      }
      return { status: "error", message: "Request denied by security policy" };
    }

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


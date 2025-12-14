"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/lib/types";
import { getServerSession } from "@/lib/get-sessions";
import { createNotification } from "@/server/actions/notifications";
import { syncStreamUser } from "@/server/actions/stream";

const updateProfileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  image: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

export async function updateProfile(data: z.infer<typeof updateProfileSchema>): Promise<ApiResponse> {
  try {
    // Await headers() before passing to getSession
    const headerStore = await headers();
    const session = await getServerSession();

    if (!session?.user) {
      return { status: "error", message: "Unauthorized" };
    }

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) return { status: "error", message: "Invalid data" };

    // Update in Database
    await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data
    });

    // Update Better Auth Session Cache (Optional but recommended for consistency)
    try {
      await auth.api.updateUser({
        body: {
          name: parsed.data.name,
          image: parsed.data.image
        },
        headers: headerStore // Pass headers here too if required by your auth setup
      });
    } catch (e) {
      console.warn("Failed to update auth session cache:", e);
      // Don't fail the whole request if just the session cache update fails
    }

    // SC: Sync to Stream
    await syncStreamUser(session.user.id, {
      name: parsed.data.name,
      // username: parsed.data.username is not available here, so we don't update it to avoid overwriting with undefined or wrong data.
      image: parsed.data.image
    });

    revalidatePath(`/profile/${session.user.username}`);
    return { status: "success", message: "Profile updated" };

  } catch (error) {
    console.error("Update Profile Error:", error);
    return { status: "error", message: "Failed to update profile" };
  }
}


export async function toggleFollow(targetUserId: string): Promise<ApiResponse<{ isFollowing: boolean; followersCount: number }>> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { status: "error", message: "Unauthorized" };

    const currentUserId = session.user.id;

    if (currentUserId === targetUserId) {
      return { status: "error", message: "You cannot follow yourself" };
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    let isFollowing = false;

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      isFollowing = false;
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
      isFollowing = true;

      await createNotification({
        recipientId: targetUserId,
        actorId: currentUserId,
        type: "FOLLOW",
        message: "started following you"
      });
    }

    // Get updated count
    const followersCount = await prisma.follow.count({
      where: { followingId: targetUserId }
    });

    // Revalidate the profile page to update the UI server-side as well
    // NOTE: In a real app, you might want to fetch the username to revalidate specific path
    // revalidatePath(`/profile/[username]`); 

    return {
      status: "success",
      message: isFollowing ? "Following" : "Unfollowed",
      data: { isFollowing, followersCount }
    };

  } catch (error) {
    console.error("Toggle Follow Error:", error);
    return { status: "error", message: "Failed to update follow status" };
  }
}


export async function searchUsers(query: string) {
  // 1. Auth Check
  const session = await getServerSession();
  if (!session?.user) return [];

  // 2. Validate input length to prevent expensive empty queries
  if (!query || query.length < 2) return [];

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
            ],
          },
          // Exclude the current user from search results
          { id: { not: session.user.id } },
        ],
      },
      take: 10, // Limit results for performance
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        // Include badge status if you want to show verified icons in search
        isVerified: true,
        isSebiVerified: true,
      },
    });

    return users;
  } catch (error) {
    console.error("Search Users Error:", error);
    return [];
  }
}

export async function syncProfileImage() {
  const session = await getServerSession();
  if (!session?.user?.image) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    });

    // Only update if DB image is missing but session has one
    if (!user?.image && session.user.image) {
      console.log(`[syncProfileImage] Syncing image for ${session.user.id}`);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: session.user.image }
      });
      return { success: true };
    }
  } catch (error) {
    console.error("Sync Profile Image Error:", error);
  }
}

import { getProfileByUsername } from "@/app/data/user/get-profile";

export async function getUserProfile(username: string) {
  if (!username) return null;
  const user = await getProfileByUsername(username);
  return user;
}
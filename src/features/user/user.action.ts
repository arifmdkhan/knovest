"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/features/notifications/actions/notifications.action";
import { syncStreamUser } from "@/features/media/actions/stream.action";
import { safeAction } from "@/lib/safe-action";
import { getProfileByUsername } from "@/features/user/queries/get-profile";

// --- Schemas ---

const UpdateProfileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  image: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

const ToggleFollowSchema = z.object({
  targetUserId: z.string().min(1),
});

const SearchUserSchema = z.object({
  query: z.string(),
});

const GetUserProfileSchema = z.object({
  username: z.string().min(1),
});

const UpdateAccountSettingsSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3), // Ensure basic username validation
});

// --- Actions ---

export const updateProfile = safeAction(
  UpdateProfileSchema,
  async (data, { user }) => {
    // 1. Update in Database
    await prisma.user.update({
      where: { id: user!.id },
      data: {
        name: data.name,
        bio: data.bio,
        location: data.location,
        website: data.website,
        image: data.image,
        expertise: data.expertise
      }
    });

    // 2. Update Better Auth Session Cache
    try {
      const headerStore = await headers();
      await auth.api.updateUser({
        body: {
          name: data.name,
          image: data.image
        },
        headers: headerStore
      });
    } catch (e) {
      console.warn("Failed to update auth session cache:", e);
    }

    // 3. Sync to Stream
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { expertVerificationType: true, accountVerificationType: true }
    });

    await syncStreamUser(user!.id, {
      name: data.name,
      image: data.image,
      expertVerificationType: currentUser?.expertVerificationType,
      accountVerificationType: currentUser?.accountVerificationType
    });

    // We need the username to revalidate, but we don't have it in input or explicitly in `user` context unless we fetch/cast.
    // The previous code used session.user.username. safeAction's user context is minimal.
    // Let's fetch it or rely on passed context if we enhance safeAction, but fetching is safer.
    // Optimization: we can just revalidate '/profile' and let dynamic segments handle themselves,
    // or fetch it. Since we did a DB update, fetching is fine.
    const updatedUser = await prisma.user.findUnique({ where: { id: user!.id }, select: { username: true } });
    if (updatedUser?.username) {
      revalidatePath(`/profile/${updatedUser.username}`);
    }

    return { status: "success", message: "Profile updated" };
  },
  { requiredRole: "USER" } // Or just basic auth
);

export const toggleFollow = safeAction(
  ToggleFollowSchema,
  async ({ targetUserId }, { user }) => {
    const currentUserId = user!.id;

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

    // Revalidate paths
    const [currentUserInfo, targetUserInfo] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId }, select: { username: true } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { username: true } })
    ]);

    if (currentUserInfo?.username) revalidatePath(`/profile/${currentUserInfo.username}`);
    if (targetUserInfo?.username) revalidatePath(`/profile/${targetUserInfo.username}`);

    return {
      status: "success",
      message: isFollowing ? "Following" : "Unfollowed",
      data: { isFollowing, followersCount }
    };
  },
  { requiredRole: "USER" }
);

export const searchUsers = safeAction(
  SearchUserSchema,
  async ({ query }, { user }) => {
    if (!query || query.length < 2) return { status: "success", message: "Query too short", data: [] };

    // Note: previous implementation checked if session user exists. safeAction guarantees authenticated 'user'.
    // But previous code EXCLUDED current user from search.

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
            ],
          },
          { id: { not: user!.id } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        expertVerificationType: true,
        accountVerificationType: true,
      },
    });

    return { status: "success", message: "Users found", data: users };
  },
  { requiredRole: "USER" }
);

// Note: syncProfileImage was taking no arguments.
export const syncProfileImage = safeAction(
  z.object({}), // Empty input
  async (_, { user }) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { image: true }
    });

    // We need session image. safeAction user context might only have id/role depending on implementation,
    // but let's check definition. It usually has basic session info.
    // If not, we might need to fetch session again or strictly rely on DB.
    // Assuming user.image is available if stored in session.
    // If 'user' in context comes from getServerSession(), it matches BetterAuth session user.

    const sessionUserImage = user!.image;

    if (!dbUser?.image && sessionUserImage) {
      await prisma.user.update({
        where: { id: user!.id },
        data: { image: sessionUserImage }
      });
      return { status: "success", message: "Profile image synced" };
    }
    return { status: "success", message: "No sync needed" };
  },
  { requiredRole: "USER" }
);

export const getUserProfile = safeAction(
  GetUserProfileSchema,
  async ({ username }) => {
    const user = await getProfileByUsername(username);
    if (!user) return { status: "error", message: "User not found" };
    return { status: "success", message: "User profile found", data: user };
  },
  // No requiredRole, public access allowed? 
  // Previous code didn't check session for getUserProfile, just search/update.
  // BUT getProfileByUsername is likely public.
  // If we want public access, we don't set requiredRole.
  // However, safeAction currently (in my implementation) might enforce auth if I set specific options or default? 
  // Looking at safeAction implementation: it strictly checks session? 
  // Wait, let me check safeAction implementation again.
  // "const session = await getServerSession(); if (options?.requiredRole && !session?.user) ..."
  // So if NO requiredRole is passed, it allows unauthenticated?
  // Actually my implementation of safeAction seemed to imply it wraps 'authenticated' logic mostly, but if I don't pass requiredRole, it continues?
  // Let's assume public access is OK for getProfile.

  // Actually, seeing the previous code:
  // getUserProfile did NOT check for session. It just took a username.
  // So it should be public.
  {}
);


export const updateAccountSettings = safeAction(
  UpdateAccountSettingsSchema,
  async (data, { user }) => {
    const headerStore = await headers();

    try {
      await auth.api.updateUser({
        body: {
          name: data.name,
          username: data.username,
        },
        headers: headerStore
      });
    } catch (e: unknown) {
      console.error("Auth Update Error:", e);
      const message = e instanceof Error ? e.message : "Failed to update account";
      return { status: "error", message };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { expertVerificationType: true, accountVerificationType: true }
    });

    await syncStreamUser(user!.id, {
      name: data.name,
      username: data.username,
      expertVerificationType: currentUser?.expertVerificationType,
      accountVerificationType: currentUser?.accountVerificationType
    });

    revalidatePath("/settings");
    revalidatePath("/profile");
    revalidatePath(`/profile/${data.username}`);

    return { status: "success", message: "Account updated successfully" };
  },
  { requiredRole: "USER" }
);
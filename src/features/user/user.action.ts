"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/features/notifications/services/create-notification";
import { syncStreamUser } from "@/features/media/actions/stream.action";
import { safeAction } from "@/lib/safe-action";
import { getProfileByUsername } from "@/features/user/queries/get-profile";


const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  website: z.string().max(2000).refine(value => !value || /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL").optional(),
  image: z.string().max(2000).optional(),
  expertise: z.array(z.string().max(100)).max(20).optional(),
});

const ToggleFollowSchema = z.object({
  targetUserId: z.string().min(1),
});

const SearchUserSchema = z.object({
  query: z.string().max(200),
});

const GetUserProfileSchema = z.object({
  username: z.string().min(1),
});

const UpdateAccountSettingsSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/), 
});



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

    // Refresh the signed cookie from the committed DB row, including custom profile fields.
    // nextCookies forwards the auth response cookies through this server action.
    await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });

    // Sync to Stream
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

    const updatedUser = await prisma.user.findUnique({ where: { id: user!.id }, select: { username: true } });
    if (updatedUser?.username) {
      revalidatePath(`/profile/${updatedUser.username}`);
    }

    return { status: "success", message: "Profile updated" };
  },
  { requiredRole: "USER" }
);

export const toggleFollow = safeAction(
  ToggleFollowSchema,
  async ({ targetUserId }, { user }) => {
    const currentUserId = user!.id;

    if (currentUserId === targetUserId) {
      return { status: "error", message: "You cannot follow yourself" };
    }

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

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUserId }
    });

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

export const getUserProfile = safeAction(
  GetUserProfileSchema,
  async ({ username }) => {
    const user = await getProfileByUsername(username);
    if (!user) return { status: "error", message: "User not found" };
    return { status: "success", message: "User profile found", data: user };
  },
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
          displayUsername: data.username,
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
      select: { username: true, name: true, expertVerificationType: true, accountVerificationType: true }
    });

    await syncStreamUser(user!.id, {
      name: currentUser!.name,
      username: currentUser!.username || undefined,
      expertVerificationType: currentUser?.expertVerificationType,
      accountVerificationType: currentUser?.accountVerificationType
    });

    revalidatePath("/settings");
    if (user!.username) revalidatePath(`/profile/${user!.username}`);
    revalidatePath(`/profile/${currentUser!.username}`);

    return { status: "success", message: "Account updated successfully", data: { name: currentUser!.name, username: currentUser!.username! } };
  },
  { requiredRole: "USER" }
);

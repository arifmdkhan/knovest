"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { Role, AccountVerificationType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiResponse } from "@/types/api";

export async function banUser(userId: string, reason?: string): Promise<ApiResponse> {
    await requireAdmin();

    try {
        // Use better-auth admin plugin to ban user
        await auth.api.banUser({
            body: {
                userId,
                banReason: reason,
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { status: "success", message: "User banned successfully" };
    } catch (error) {
        console.error("Failed to ban user:", error);
        return { status: "error", message: "Failed to ban user" };
    }
}

export async function unbanUser(userId: string): Promise<ApiResponse> {
    await requireAdmin();

    try {
        // Use better-auth admin plugin to unban user
        await auth.api.unbanUser({
            body: {
                userId,
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { status: "success", message: "User unbanned successfully" };
    } catch (error) {
        console.error("Failed to unban user:", error);
        return { status: "error", message: "Failed to unban user" };
    }
}

export async function updateUserRole(userId: string, role: Role): Promise<ApiResponse> {
    // Basic Admin check
    await requireAdmin();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) return { status: "error", message: "Unauthorized" };
    const currentUserRole = session.user.role;

    // Constraint 1: Only SUPER_ADMIN can promote someone to ADMIN (or SUPER_ADMIN)
    if ((role === "ADMIN" || role === "SUPER_ADMIN") && currentUserRole !== "SUPER_ADMIN") {
        return { status: "error", message: "Only Super Admins can grant Admin privileges." };
    }

    try {
        // Fetch target to check if we are modifying a SUPER_ADMIN
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        // Constraint 2: Only SUPER_ADMIN can modify another SUPER_ADMIN
        if (targetUser?.role === "SUPER_ADMIN" && currentUserRole !== "SUPER_ADMIN") {
            return { status: "error", message: "Only Super Admins can modify other Super Admins." };
        }

        // Use better-auth admin plugin to set role if available, or update DB directly
        await auth.api.setRole({
            body: {
                userId,
                role: role.toLowerCase() as any
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { status: "success", message: "User role updated successfully" };
    } catch (error) {
        console.error("Failed to update user role:", error);
        // Fallback to direct DB update
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { role },
            });
            revalidatePath("/admin/users");
            return { status: "success", message: "User role updated successfully (DB fallback)" };
        } catch (dbError) {
            console.error("Fallback DB update failed:", dbError);
            return { status: "error", message: "Failed to update user role" };
        }
    }
}


export async function revokeUserSessions(userId: string): Promise<ApiResponse> {
    await requireAdmin();
    const session = await auth.api.getSession({ headers: await headers() });

    // Check target role
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (targetUser?.role === "SUPER_ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
        return { status: "error", message: "Only Super Admins can manage Super Admin sessions." };
    }

    try {
        await auth.api.revokeUserSessions({
            body: {
                userId,
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { status: "success", message: "Sessions revoked successfully" };
    } catch (error) {
        console.error("Failed to revoke user sessions:", error);
        return { status: "error", message: "Failed to revoke sessions" };
    }
}

export async function removeUser(userId: string): Promise<ApiResponse> {
    await requireAdmin();
    const session = await auth.api.getSession({ headers: await headers() });

    // Check target role
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (targetUser?.role === "SUPER_ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
        return { status: "error", message: "Only Super Admins can remove Super Admins." };
    }

    try {
        await auth.api.removeUser({
            body: {
                userId,
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { status: "success", message: "User removed successfully" };
    } catch (error) {
        console.error("Failed to remove user:", error);
        return { status: "error", message: "Failed to remove user" };
    }
}

export async function updateAccountVerification(userId: string, type: AccountVerificationType): Promise<ApiResponse> {
    await requireAdmin();
    const session = await auth.api.getSession({ headers: await headers() });

    // Only SUPER_ADMIN can set OFFICIAL or modify verification freely
    if (session?.user?.role !== "SUPER_ADMIN") {
        return { status: "error", message: "Only Super Admins can manage verification statuses." };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { accountVerificationType: type }
        });
        revalidatePath("/admin/users");
        return { status: "success", message: "Verification status updated successfully" };
    } catch (error) {
        console.error("Failed to update verification:", error);
        return { status: "error", message: "Failed to update verification" };
    }
}

// Obsolete verification toggle Removed. Use specific update actions if needed.

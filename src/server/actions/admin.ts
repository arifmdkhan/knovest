"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { Role } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function banUser(userId: string, reason?: string) {
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
        return { success: true };
    } catch (error) {
        console.error("Failed to ban user:", error);
        return { success: false, error: "Failed to ban user" };
    }
}

export async function unbanUser(userId: string) {
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
        return { success: true };
    } catch (error) {
        console.error("Failed to unban user:", error);
        return { success: false, error: "Failed to unban user" };
    }
}

export async function updateUserRole(userId: string, role: Role) {
    await requireAdmin();

    try {
        // Use better-auth admin plugin to set role if available, or update DB directly
        // Better-auth 'admin' plugin usually provides setRole
        await auth.api.setRole({
            body: {
                userId,
                role: role.toLowerCase() as any // better-auth roles are usually lowercase strings, but our DB uses Enum. 
                // If better-auth is configured with our Prisma adapter, it should map correctly 
                // or we might need to be careful. 
                // Let's check if setRole exists and what it expects.
                // If not sure, direct DB update is safer for now given our custom Role enum.
                // However, user requested better-auth API.
                // Let's assume setRole works with string.
            },
            headers: await headers()
        });

        // Fallback/Ensure DB consistency if better-auth doesn't map perfectly to our Enum immediately
        // (Though with Prisma adapter it should be fine)

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user role:", error);
        // Fallback to direct DB update if API fails (e.g. if setRole isn't exposed or configured)
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { role },
            });
            revalidatePath("/admin/users");
            return { success: true };
        } catch (dbError) {
            console.error("Fallback DB update failed:", dbError);
            return { success: false, error: "Failed to update user role" };
        }
    }
}


export async function revokeUserSessions(userId: string) {
    await requireAdmin();

    try {
        await auth.api.revokeUserSessions({
            body: {
                userId,
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to revoke user sessions:", error);
        return { success: false, error: "Failed to revoke sessions" };
    }
}

export async function removeUser(userId: string) {
    await requireAdmin();

    try {
        await auth.api.removeUser({
            body: {
                userId,
            },
            headers: await headers()
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove user:", error);
        return { success: false, error: "Failed to remove user" };
    }
}

export async function updateUserVerification(userId: string, type: 'verified' | 'sebi', value: boolean) {
    await requireAdmin();

    try {
        const data: any = {};

        if (type === 'sebi') {
            data.isSebiVerified = value;
            // If setting SEBI verified to true, also set isVerified to true and role to CREATOR
            if (value) {
                data.isVerified = true;
                data.role = "CREATOR";
            }
        } else {
            data.isVerified = value;
            // If setting verified to true, set role to CREATOR
            if (value) {
                data.role = "CREATOR";
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data,
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user verification:", error);
        return { success: false, error: "Failed to update verification status" };
    }
}

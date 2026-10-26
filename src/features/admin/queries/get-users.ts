import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { Role } from "@/generated/prisma/client";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: Role;
    banned: boolean | null;
    createdAt: Date;
    username: string | null;
    expertVerificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
    accountVerificationType: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
}

export interface GetAdminUsersParams {
    page?: number;
    limit?: number;
    query?: string;
}

export interface GetAdminUsersResult {
    users: AdminUser[];
    total: number;
    totalPages: number;
}

export async function getAdminUsers({ page = 1, limit = 10, query = "" }: GetAdminUsersParams = {}): Promise<GetAdminUsersResult> {
    await requireAdmin();

    const skip = (page - 1) * limit;

    const where = query
        ? {
            OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
                { username: { contains: query, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                banned: true,
                createdAt: true,
                username: true,
                expertVerificationType: true,
                accountVerificationType: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { users: users as AdminUser[], total, totalPages };
}

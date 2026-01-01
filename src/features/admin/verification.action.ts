"use server";

import { prisma } from "@/lib/db";
import { VerificationStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";
import { safeAction } from "@/lib/safe-action";
import { z } from "zod";

// --- Schemas ---
const GetApplicationsSchema = z.object({
    statusFilter: z.nativeEnum(VerificationStatus).optional()
});

const ApplicationIdSchema = z.object({
    applicationId: z.string().min(1)
});

const RejectApplicationSchema = z.object({
    applicationId: z.string().min(1),
    reason: z.string().min(1, "Rejection reason is required")
});

const RequestInfoSchema = z.object({
    applicationId: z.string().min(1),
    notes: z.string().min(1, "Review notes are required")
});

// --- Fetch Applications ---
export const getVerificationApplications = safeAction(
    GetApplicationsSchema,
    async ({ statusFilter }) => {
        const applications = await prisma.verificationApplication.findMany({
            where: statusFilter ? { status: statusFilter } : {},
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    }
                },
                certifications: true,
                brokerPnls: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return { status: "success", message: "Applications fetched successfully", data: applications };
    },
    { requiredRole: "ADMIN" }
);

// --- Approve Application ---
export const approveApplication = safeAction(
    ApplicationIdSchema,
    async ({ applicationId }) => {
        // 1. Get the application
        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            include: { certifications: true, brokerPnls: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        // Determine Verification Type
        let verificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" = "TRACK_RECORD";
        const enableSubscription = false; // Default false

        if (application.isSebiRegistered) {
            verificationType = "SEBI";
        } else if (application.hasCertifications) {
            verificationType = "CERTIFIED";
        } else {
            verificationType = "TRACK_RECORD";
        }

        // 2. Transaction
        await prisma.$transaction([
            prisma.verificationApplication.update({
                where: { id: applicationId },
                data: {
                    status: "APPROVED",
                    rejectionReason: null,
                    reviewNotes: "Approved by Admin",
                    updatedAt: new Date()
                }
            }),
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    expertVerificationType: verificationType,
                    expertVerifiedAt: new Date(),
                    isSubscriptionEnabled: enableSubscription,
                }
            })
        ]);

        revalidatePath("/admin/expert-verification");
        return { status: "success", message: "Application approved successfully" };
    },
    { requiredRole: "ADMIN" }
);

// --- Reject Application ---
export const rejectApplication = safeAction(
    RejectApplicationSchema,
    async ({ applicationId, reason }) => {
        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        await prisma.$transaction([
            prisma.verificationApplication.update({
                where: { id: applicationId },
                data: {
                    status: "REJECTED",
                    rejectionReason: reason,
                    reviewNotes: `Rejected by Admin: ${reason}`,
                    updatedAt: new Date()
                }
            }),
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    expertVerificationType: null,
                    accountVerificationType: "NONE"
                }
            })
        ]);

        revalidatePath("/admin/expert-verification");
        return { status: "success", message: "Application rejected and user verification revoked" };
    },
    { requiredRole: "ADMIN" }
);

// --- Reset Application ---
export const resetApplication = safeAction(
    ApplicationIdSchema,
    async ({ applicationId }) => {
        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        await prisma.$transaction([
            prisma.verificationApplication.update({
                where: { id: applicationId },
                data: {
                    status: "PENDING",
                    rejectionReason: null,
                    reviewNotes: "Status reset to Pending by Admin",
                    updatedAt: new Date()
                }
            }),
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    expertVerificationType: null,
                    accountVerificationType: "NONE"
                }
            })
        ]);

        revalidatePath("/admin/expert-verification");
        return { status: "success", message: "Application status reset to Pending" };
    },
    { requiredRole: "ADMIN" }
);

// --- Request Additional Info ---
export const requestAdditionalInfo = safeAction(
    RequestInfoSchema,
    async ({ applicationId, notes }) => {
        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        await prisma.$transaction([
            prisma.verificationApplication.update({
                where: { id: applicationId },
                data: {
                    status: "ACTION_REQUIRED",
                    reviewNotes: notes,
                    updatedAt: new Date()
                }
            }),
            prisma.user.update({
                where: { id: application.userId },
                data: {
                    expertVerificationType: null,
                    accountVerificationType: "NONE"
                }
            })
        ]);

        revalidatePath("/admin/expert-verification");
        return { status: "success", message: "Application returned for additional info" };
    },
    { requiredRole: "ADMIN" }
);

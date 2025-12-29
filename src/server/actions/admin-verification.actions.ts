"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { VerificationStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";

// --- Fetch Applications ---
export async function getVerificationApplications(statusFilter?: VerificationStatus): Promise<ApiResponse<any[]>> {
    try {
        const session = await getServerSession();
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
            return { status: "error", message: "Unauthorized" };
        }

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
    } catch (error) {
        console.error("Error fetching verification applications:", error);
        return { status: "error", message: error instanceof Error ? error.message : "Failed to fetch applications" };
    }
}

// --- Approve Application ---
export async function approveApplication(applicationId: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
            return { status: "error", message: "Unauthorized" };
        }

        // 1. Get the application to check details
        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            include: { certifications: true, brokerPnls: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        // Determine Verification Type
        let verificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" = "TRACK_RECORD";
        const enableSubscription = false;

        if (application.isSebiRegistered) {
            verificationType = "SEBI";
            // enableSubscription remains false by default
        } else if (application.hasCertifications) {
            verificationType = "CERTIFIED";
        } else {
            // Defaulting to TRACK_RECORD if neither SEBI nor Certified (Assuming P&L verified by admin manual review before clicking approve)
            verificationType = "TRACK_RECORD";
        }

        // 2. Transaction: Update App Status + Update User Profile
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
                    // If they are SEBI or CERTIFIED or TRACK_RECORD, they get "Expert" capabilities implied by the verificationType presence.
                }
            })
        ]);

        revalidatePath("/admin/expert-verification");
        return { status: "success", message: "Application approved successfully" };
    } catch (error) {
        console.error("Error approving application:", error);
        return { status: "error", message: error instanceof Error ? error.message : "Failed to approve application" };
    }
}

// --- Reject Application ---
export async function rejectApplication(applicationId: string, reason: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
            return { status: "error", message: "Unauthorized" };
        }

        if (!reason) {
            return { status: "error", message: "Rejection reason is required" };
        }

        // 1. Get the application to check details (need userId to revoke)
        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        // 2. Transaction: Update App Status + Revoke User Verification
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
            // Revoke verification flags on user
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
    } catch (error) {
        console.error("Error rejecting application:", error);
        return { status: "error", message: error instanceof Error ? error.message : "Failed to reject application" };
    }
}

// --- Reset Application (Set to Pending) ---
export async function resetApplication(applicationId: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
            return { status: "error", message: "Unauthorized" };
        }

        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        // Transaction: Set status to PENDING + Revoke User Verification
        await prisma.$transaction([
            prisma.verificationApplication.update({
                where: { id: applicationId },
                data: {
                    status: "PENDING",
                    // We keep rejectionReason if any, or clear it? Usually if we reset to pending we might want to keep the history or clear it.
                    // Let's clear the explicit rejection reason so it doesn't look like a rejection, 
                    // but we might want to add a note.
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
    } catch (error) {
        console.error("Error resetting application:", error);
        return { status: "error", message: error instanceof Error ? error.message : "Failed to reset application" };
    }
}

// --- Request Additional Info ---
export async function requestAdditionalInfo(applicationId: string, notes: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
            return { status: "error", message: "Unauthorized" };
        }

        if (!notes) {
            return { status: "error", message: "Review notes are required" };
        }

        const application = await prisma.verificationApplication.findUnique({
            where: { id: applicationId },
            select: { userId: true }
        });

        if (!application) {
            return { status: "error", message: "Application not found" };
        }

        // Transaction: Update status, save notes, revoke verification (safeguard)
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
    } catch (error) {
        console.error("Error requesting additional info:", error);
        return { status: "error", message: error instanceof Error ? error.message : "Failed to request info" };
    }
}

"use server";

import { prisma as db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VerificationStatus } from "../../generated/prisma/enums";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiResponse } from "@/types/api";

// --- Types ---

export type VerificationApplicationInput = {
  // Step 1: Identity
  fullName?: string;
  dateOfBirth?: Date;
  nationality?: string;
  state?: string;
  panNumber?: string;
  mobileNumber?: string;

  // Step 2: SEBI
  isSebiRegistered?: boolean;
  sebiLicenseType?: string;
  sebiRegNumber?: string;
  sebiRegName?: string;
  sebiCertUrl?: string; // S3/R2 URL
  sebiExpiry?: Date;

  // Step 3: Certifications
  hasCertifications?: boolean;
  certifications?: {
    id?: string; // existing ID if updating
    name: string;
    issuingAuthority?: string;
    completionYear?: number;
    certNumber?: string;
    expiryDate?: Date;
    certUrl?: string;
  }[];

  // Step 4: P&L
  pnlVerified?: boolean;
  brokerPnls?: {
    id?: string;
    brokerName: string;
    pnlLink: string;
    accountHolder: string;
    fileUrl?: string;
  }[];

  hasAgreedToTerms?: boolean;
};

// --- Actions ---

/**
 * Gets the current user's verification application status
 */
export async function getVerificationStatus(): Promise<ApiResponse<{
  status: VerificationStatus | null;
  application: any; // Ideally this would be a generated type from Prisma
  user: { name: string; email: string };
}>> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return { status: "error", message: "Unauthorized" };
  }

  const user = session.user;

  const application = await db.verificationApplication.findUnique({
    where: { userId: user.id },
    include: {
      certifications: true,
      brokerPnls: true,
    },
  });

  return {
    status: "success",
    message: "Verification status fetched successfully",
    data: {
      status: (application?.status as VerificationStatus) || null,
      application,
      user: {
        name: user.name,
        email: user.email,
      }
    }
  };
}

/**
 * Creates or updates a draft application
 * This function saves progress as the user moves through steps.
 */
export async function saveApplicationDraft(
  data: VerificationApplicationInput
): Promise<ApiResponse<{ applicationId: string; status: VerificationStatus }>> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return { status: "error", message: "Unauthorized" };
  }

  const user = session.user;

  try {
    const existing = await db.verificationApplication.findUnique({
      where: { userId: user.id },
    });

    if (existing && existing.status === "PENDING") {
      return { status: "error", message: "Application is under review" };
    }

    if (existing && existing.status === "REJECTED") {
      return { status: "error", message: "Application was rejected. You can re-apply after 3 months." };
    }

    // Helper to handle nested updates/creates for repeatable fields
    const certificationOps = data.certifications ? {
      deleteMany: {},
      create: data.certifications.map(c => ({
        name: c.name,
        issuingAuthority: c.issuingAuthority,
        completionYear: c.completionYear,
        certNumber: c.certNumber,
        expiryDate: c.expiryDate,
        certUrl: c.certUrl,
      }))
    } : undefined;

    const pnlOps = data.brokerPnls ? {
      deleteMany: {},
      create: data.brokerPnls.map(p => ({
        brokerName: p.brokerName,
        pnlLink: p.pnlLink,
        accountHolder: p.accountHolder,
        fileUrl: p.fileUrl,
      }))
    } : undefined;


    const application = await db.verificationApplication.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: "DRAFT",
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        state: data.state,
        panNumber: data.panNumber,
        mobileNumber: data.mobileNumber,

        isSebiRegistered: data.isSebiRegistered,
        sebiLicenseType: data.sebiLicenseType,
        sebiRegNumber: data.sebiRegNumber,
        sebiRegName: data.sebiRegName,
        sebiCertUrl: data.sebiCertUrl,
        sebiExpiry: data.sebiExpiry,

        hasCertifications: data.hasCertifications,
        certifications: certificationOps ? { create: certificationOps.create } : undefined,

        pnlVerified: data.pnlVerified,
        brokerPnls: pnlOps ? { create: pnlOps.create } : undefined,

        hasAgreedToTerms: data.hasAgreedToTerms,
      },
      update: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
        ...(data.nationality !== undefined && { nationality: data.nationality }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.panNumber !== undefined && { panNumber: data.panNumber }),
        ...(data.mobileNumber !== undefined && { mobileNumber: data.mobileNumber }),

        ...(data.isSebiRegistered !== undefined && { isSebiRegistered: data.isSebiRegistered }),
        ...(data.sebiLicenseType !== undefined && { sebiLicenseType: data.sebiLicenseType }),
        ...(data.sebiRegNumber !== undefined && { sebiRegNumber: data.sebiRegNumber }),
        ...(data.sebiRegName !== undefined && { sebiRegName: data.sebiRegName }),
        ...(data.sebiCertUrl !== undefined && { sebiCertUrl: data.sebiCertUrl }),
        ...(data.sebiExpiry !== undefined && { sebiExpiry: data.sebiExpiry }),

        ...(data.hasCertifications !== undefined && { hasCertifications: data.hasCertifications }),
        ...(data.certifications !== undefined && { certifications: certificationOps }),

        ...(data.pnlVerified !== undefined && { pnlVerified: data.pnlVerified }),
        ...(data.brokerPnls !== undefined && { brokerPnls: pnlOps }),

        ...(data.hasAgreedToTerms !== undefined && { hasAgreedToTerms: data.hasAgreedToTerms }),

        updatedAt: new Date(),
      }
    });

    revalidatePath("/verification");
    return {
      status: "success",
      message: "Draft saved successfully",
      data: { applicationId: application.id, status: application.status as VerificationStatus }
    };

  } catch (error) {
    console.error("Error saving verification draft:", error);
    return { status: "error", message: "Failed to save draft" };
  }
}

/**
 * Submits the application for review
 */
export async function submitApplication(applicationId: string): Promise<ApiResponse<{ status: VerificationStatus }>> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return { status: "error", message: "Unauthorized" };
  }

  const user = session.user;

  try {
    // 1. Fetch current data to validate
    const application = await db.verificationApplication.findUnique({
      where: { id: applicationId },
      include: {
        brokerPnls: true,
        certifications: true
      }
    });

    if (!application || application.userId !== user.id) {
      return { status: "error", message: "Application not found" };
    }

    // 2. Validate Required Fields (SERVER SIDE ENFORCEMENT)
    const errors: string[] = [];
    if (!application.fullName) errors.push("Full Name is required");
    if (!application.panNumber) errors.push("PAN Number is required");
    if (application.isSebiRegistered === null) errors.push("SEBI Registration status required");
    if (application.isSebiRegistered && !application.sebiCertUrl) errors.push("SEBI Certificate upload is required");

    if (application.hasCertifications) {
      if (!application.certifications || application.certifications.length === 0) {
        errors.push("At least one certification is required if you indicated you have them");
      } else {
        const missingCert = application.certifications.some((c) => !c.certUrl);
        if (missingCert) errors.push("Proof of document is required for all listed certifications");
      }
    }

    const needPnl = !application.isSebiRegistered;

    if (needPnl && !application.hasCertifications) {
      // Strictly P&L route
      if (application.brokerPnls.length === 0) {
        errors.push("At least one Broker P&L link is required for this category");
      }
    }

    if (errors.length > 0) {
      return { status: "error", message: errors.join(", ") };
    }

    // 3. Update Status
    await db.verificationApplication.update({
      where: { id: applicationId },
      data: {
        status: "PENDING",
        submittedAt: new Date()
      }
    });

    revalidatePath("/verification");
    return { status: "success", message: "Application submitted successfully", data: { status: "PENDING" as VerificationStatus } };

  } catch (error) {
    console.error("Error submitting application:", error);
    return { status: "error", message: "Submission failed" };
  }
}

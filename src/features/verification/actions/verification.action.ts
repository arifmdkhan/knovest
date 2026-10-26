"use server";

import { prisma as db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { VerificationStatus } from "@/generated/prisma/enums";
import { getServerSession } from "@/lib/get-sessions";
import { ApiResponse } from "@/types/api";
import { VerificationApplicationInput } from "../types";
import { z } from "zod";
import { isCanonicalKey } from "@/lib/storage/asset-keys";
import { enforceRateLimit } from "@/lib/rate-limit";

const text = z.string().max(200);
const document = z.string().max(1000);
const draftSchema = z.object({
  fullName: text.optional(), dateOfBirth: z.date().optional(), nationality: text.optional(), state: text.optional(),
  panNumber: z.string().max(10).optional(), mobileNumber: z.string().max(20).optional(),
  isSebiRegistered: z.boolean().optional(), sebiLicenseType: text.optional(), sebiRegNumber: text.optional(), sebiRegName: text.optional(),
  sebiCertUrl: document.optional(), sebiExpiry: z.date().optional(), hasCertifications: z.boolean().optional(),
  certifications: z.array(z.object({ name: text, issuingAuthority: text.optional(), completionYear: z.number().int().min(1900).max(2100).optional(), certNumber: text.optional(), expiryDate: z.date().optional(), certUrl: document.optional() })).max(20).optional(),
  brokerPnls: z.array(z.object({ brokerName: text, pnlLink: z.string().max(2000).refine(value => !value || /^https?:\/\//i.test(value)), accountHolder: text, fileUrl: document.optional() })).max(10).optional(),
  hasAgreedToTerms: z.boolean().optional(),
});


/**
 * Gets the current user's verification application status
 */
export async function getVerificationStatus(): Promise<ApiResponse<{
  status: VerificationStatus | null;
  application: any; // will use prisma generated type later
  user: { name: string; email: string };
}>> {
  const session = await getServerSession();

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
 * 
 */
export async function saveApplicationDraft(
  data: VerificationApplicationInput
): Promise<ApiResponse<{ applicationId: string; status: VerificationStatus }>> {
  const session = await getServerSession();

  if (!session?.user) {
    return { status: "error", message: "Unauthorized" };
  }

  const user = session.user;

  try {
    await enforceRateLimit(`verification:${user.id}`, 20);
    const parsed = draftSchema.safeParse(data);
    if (!parsed.success) return { status: "error", message: "Invalid application data" };
    data = parsed.data;
    const documents = [data.sebiCertUrl, ...(data.certifications || []).map(item => item.certUrl), ...(data.brokerPnls || []).map(item => item.fileUrl)].filter(Boolean) as string[];
    if (documents.some(key => !isCanonicalKey(key) || !key.startsWith(`documents/users/${user.id}/`) || !key.endsWith(".pdf"))) {
      return { status: "error", message: "Documents must belong to your account" };
    }
    const existing = await db.verificationApplication.findUnique({
      where: { userId: user.id },
    });

    if (existing && (existing.status === "PENDING" || existing.status === "APPROVED")) {
      return { status: "error", message: "Application is under review" };
    }

    if (existing && existing.status === "REJECTED") {
      return { status: "error", message: "Application was rejected. Contact support about a review." };
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
      where: { userId: user.id, status: "DRAFT" },
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
  const session = await getServerSession();

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

    if (application.status !== "DRAFT") return { status: "error", message: "Only a draft application can be submitted" };

    // 2. Validate Required Fields (SERVER SIDE ENFORCEMENT)
    const errors: string[] = [];
    if (!application.fullName) errors.push("Full Name is required");
    if (!application.hasAgreedToTerms) errors.push("Accept the verification terms before submitting");
    if (!application.panNumber) errors.push("PAN Number is required");
    if (!application.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(application.panNumber)) errors.push("A valid PAN is required");
    if (!application.mobileNumber || !/^[0-9]{10}$/.test(application.mobileNumber)) errors.push("A valid mobile number is required");
    if (!application.nationality || !application.state) errors.push("Nationality and state are required");
    const birth = application.dateOfBirth && new Date(application.dateOfBirth);
    const adultOn = birth && new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
    if (!adultOn || adultOn > new Date()) errors.push("You must be at least 18 years old");
    if (application.isSebiRegistered === null) errors.push("SEBI Registration status required");
    if (application.isSebiRegistered && !application.sebiCertUrl) errors.push("SEBI Certificate upload is required");
    const documents = [application.sebiCertUrl, ...application.certifications.map(item => item.certUrl), ...application.brokerPnls.map(item => item.fileUrl)].filter(Boolean) as string[];
    if (documents.some(key => !isCanonicalKey(key) || !key.startsWith(`documents/users/${user.id}/`) || !key.endsWith(".pdf"))) errors.push("Re-upload documents to your account before submitting");

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
    const updated = await db.verificationApplication.updateMany({
      where: { id: applicationId, userId: user.id, status: "DRAFT" },
      data: {
        status: "PENDING",
        submittedAt: new Date()
      }
    });
    if (updated.count !== 1) return { status: "error", message: "Application changed. Refresh and try again." };

    revalidatePath("/verification");
    return { status: "success", message: "Application submitted successfully", data: { status: "PENDING" as VerificationStatus } };

  } catch (error) {
    console.error("Error submitting application:", error);
    return { status: "error", message: "Submission failed" };
  }
}

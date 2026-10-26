"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

export async function confirmEnrollment(enrollmentId: string): Promise<ApiResponse> {
    const user = await requireUser();

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { course: true }
        });

        if (!enrollment) {
            return { status: "error", message: "Enrollment not found" };
        }

        if (enrollment.userId !== user.id) {
            return { status: "error", message: "Unauthorized" };
        }

        if (enrollment.status === "Active") {
            return { status: "success", message: "Enrollment is already active" };
        }

        if (enrollment.status !== "Pending" || enrollment.amount > 0 || (enrollment.course.offerPrice ?? enrollment.course.price) > 0) {
            return { status: "error", message: "Paid enrollment requires a verified payment. Payments are not available yet." };
        }

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { status: "Active", updatedAt: new Date() }
        });

        revalidatePath(`/academy/course/${enrollment.course.slug}`);
        revalidatePath("/academy/enrolled");

        return { status: "success", message: "Enrollment confirmed successfully" };

    } catch (error) {
        console.error("Confirm Enrollment Error:", error);
        return { status: "error", message: "Failed to confirm enrollment" };
    }
}

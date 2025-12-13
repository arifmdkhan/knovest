"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";

export async function enrollCourse(courseId: string): Promise<ApiResponse<{ checkoutUrl: string }>> {
    const user = await requireUser();

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, price: true, userId: true }
        });

        if (!course) {
            return { status: "error", message: "Course not found" };
        }

        if (course.userId === user.id) {
            return { status: "error", message: "You cannot enroll in your own course" };
        }

        const result = await prisma.$transaction(async (tx) => {
            const existingEnrollment = await tx.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: course.id
                    }
                }
            });

            if (existingEnrollment?.status === "Active") {
                return { status: "error", message: "You are already enrolled in this course" }; // Changed to error to prevent redirect loop or handle differently
            }

            let enrollmentId = existingEnrollment?.id;

            if (existingEnrollment) {
                await tx.enrollment.update({
                    where: { id: existingEnrollment.id },
                    data: { status: "Pending", updatedAt: new Date() }
                });
            } else {
                const newEnrollment = await tx.enrollment.create({
                    data: {
                        userId: user.id,
                        courseId: course.id,
                        amount: course.price,
                        status: "Pending"
                    }
                });
                enrollmentId = newEnrollment.id;
            }

            return { checkoutUrl: `/academy/payment?enrollmentId=${enrollmentId}` };
        });

        if ('status' in result && result.status === 'error') {
            return result as ApiResponse<{ checkoutUrl: string }>;
        }

        return {
            status: "success",
            message: "Redirecting to payment...",
            data: { checkoutUrl: (result as any).checkoutUrl }
        };

    } catch (error) {
        console.error("Enroll Action Error:", error);
        return { status: "error", message: "Failed to initiate enrollment" };
    }
}

"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteReview(reviewId: string, courseId: string) {
    const user = await requireUser();

    try {
        const review = await prisma.review.findUnique({
            where: {
                id: reviewId,
            },
        });

        if (!review) {
            return {
                status: "error",
                message: "Review not found.",
            };
        }

        if (review.userId !== user.id) {
            return {
                status: "error",
                message: "You are not authorized to delete this review.",
            };
        }

        await prisma.review.delete({
            where: {
                id: reviewId,
            },
        });

        revalidatePath(`/academy/course/${courseId}`);
        return {
            status: "success",
            message: "Review deleted successfully.",
        };
    } catch (error) {
        console.error("Error deleting review:", error);
        return {
            status: "error",
            message: "Failed to delete review.",
        };
    }
}

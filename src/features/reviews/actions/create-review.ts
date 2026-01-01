"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiResponse } from "@/types/api";

const createReviewSchema = z.object({
    courseId: z.string(),
    rating: z.number(),
    comment: z.string().min(1, "Comment cannot be empty"),
    parentId: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.parentId) {
        if (data.rating < 1 || data.rating > 5) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Rating must be between 1 and 5",
                path: ["rating"],
            });
        }
    }
});

export async function createReview(formData: FormData): Promise<ApiResponse> {
    const user = await requireUser();

    const rawData = {
        courseId: formData.get("courseId"),
        rating: Number(formData.get("rating")),
        comment: formData.get("comment"),
        parentId: formData.get("parentId") || undefined,
    };

    const validatedData = createReviewSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            status: "error",
            message: (validatedData.error as any).errors[0].message,
        };
    }

    const { courseId, rating, comment, parentId } = validatedData.data;

    try {
        // 1. Check Enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId,
                },
            },
        });

        if (!enrollment || enrollment.status !== "Active") {
            return {
                status: "error",
                message: "You must be enrolled in this course to leave a review.",
            };
        }

        // 2. Check if user already reviewed (only for top-level reviews)
        if (!parentId) {
            const existingReview = await prisma.review.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: courseId,
                    },
                },
            });

            if (existingReview) {
                return {
                    status: "error",
                    message: "You have already reviewed this course.",
                };
            }
        }

        // 3. Create Review
        await prisma.review.create({
            data: {
                rating: parentId ? 0 : rating, // Replies don't have a rating
                comment,
                userId: user.id,
                courseId,
                parentId,
            },
        });

        revalidatePath(`/academy/course/${courseId}`);
        return {
            status: "success",
            message: "Review submitted successfully!",
        };
    } catch (error) {
        console.error("Error creating review:", error);
        return {
            status: "error",
            message: "Failed to submit review.",
        };
    }
}

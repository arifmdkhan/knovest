import "server-only";
import { prisma } from "@/lib/db";

export async function getCourseReviews(courseId: string) {
    const reviews = await prisma.review.findMany({
        where: {
            courseId: courseId,
            parentId: null, // Fetch only top-level reviews
        },
        include: {
            user: true,
            replies: {
                include: {
                    user: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Calculate aggregate ratings
    const allRatings = await prisma.review.findMany({
        where: {
            courseId: courseId,
            parentId: null,
        },
        select: {
            rating: true,
        },
    });

    const totalReviews = allRatings.length;
    const averageRating =
        totalReviews > 0
            ? allRatings.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

    return {
        reviews,
        totalReviews,
        averageRating,
    };
}

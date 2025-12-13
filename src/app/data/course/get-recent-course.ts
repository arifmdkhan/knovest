
import { prisma } from "@/lib/db";
import "server-only";

export async function getRecentPublicCourse(currentUserId: string) {
    const data = await prisma.course.findFirst({
        where: {
            status: "Published",
            userId: {
                not: currentUserId,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            title: true,
            smallDescription: true,
            price: true,
            level: true,
            duration: true,
            fileKey: true,
            slug: true,
            category: true,
            user: {
                select: {
                    name: true,
                    username: true,
                    image: true,
                    isVerified: true,
                    isSebiVerified: true,
                },
            },
            reviews: {
                select: {
                    rating: true,
                },
            },
        },
    });
    return data;
}

export type RecentCourseType = Awaited<ReturnType<typeof getRecentPublicCourse>>;

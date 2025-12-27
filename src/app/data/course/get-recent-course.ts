
import { prisma } from "@/lib/db";
import "server-only";

export async function getRecentPublicCourse(currentUserId: string) {
    const data = await prisma.course.findMany({
        where: {
            status: "Published",
            userId: {
                not: currentUserId,
            },
            enrollment: {
                none: {
                    userId: currentUserId,
                    status: "Active",
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 10,
        select: {
            id: true,
            title: true,
            smallDescription: true,
            price: true,
            offerPrice: true,
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
                    expertVerificationType: true,
                    accountVerificationType: true,
                },
            },
            reviews: {
                select: {
                    rating: true,
                },
            },
            enrollment: {
                where: {
                    userId: currentUserId,
                },
                take: 1
            },
            savedBy: {
                where: {
                    userId: currentUserId,
                },
                select: { id: true }
            },
        },
    });

    if (data.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * data.length);
    const course = data[randomIndex];

    return {
        ...course,
        isSaved: course.savedBy.length > 0,
        savedBy: undefined
    };
}

export type RecentCourseType = Awaited<ReturnType<typeof getRecentPublicCourse>>;

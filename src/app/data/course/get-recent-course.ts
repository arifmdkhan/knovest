
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
            enrollment: {
                where: {
                    userId: currentUserId,
                },
                take: 1
            },
        },
    });

    if (data.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
}

export type RecentCourseType = Awaited<ReturnType<typeof getRecentPublicCourse>>;

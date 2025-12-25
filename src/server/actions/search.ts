"use server";

import { prisma } from "@/lib/db";

import { getServerSession } from "@/lib/get-sessions";

export async function searchGlobal(query: string) {
    if (!query || query.length < 2) {
        return { users: [], courses: [], articles: [] };
    }

    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    console.log(`[searchGlobal] Searching for: "${query}"`);

    try {
        const [users, coursesData, articles] = await Promise.all([
            // 1. Search Users
            prisma.user.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { name: { contains: query, mode: "insensitive" } },
                                { username: { contains: query, mode: "insensitive" } },
                            ],
                        },
                        currentUserId ? { id: { not: currentUserId } } : {},
                    ],
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    isVerified: true,
                    isSebiVerified: true,
                },
            }),

            // 2. Search Courses
            prisma.course.findMany({
                where: {
                    title: { contains: query, mode: "insensitive" },
                    status: "Published",
                },
                take: 5,
                include: {
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
                    enrollment: currentUserId ? {
                        where: {
                            userId: currentUserId,
                            status: "Active",
                        },
                    } : false,
                    savedBy: currentUserId ? {
                        where: { userId: currentUserId },
                        select: { id: true }
                    } : false,
                },
            }),

            // 3. Search Articles
            prisma.article.findMany({
                where: {
                    title: { contains: query, mode: "insensitive" },
                    status: "PUBLISHED",
                },
                take: 5,
                include: {
                    author: {
                        select: {
                            name: true,
                            username: true,
                            image: true,
                            isVerified: true,
                            isSebiVerified: true,
                        },
                    },
                },
            }),
        ]);

        const formattedCourses = coursesData.map(course => ({
            ...course,
            isSaved: course.savedBy?.length > 0,
            savedBy: undefined
        }));

        return { users, courses: formattedCourses, articles };
    } catch (error) {
        console.error("Global Search Error:", error);
        return { users: [], courses: [], articles: [] };
    }
}

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";

export async function getSavedCourses(cursor?: string, limit = 10) {
    const session = await getServerSession();
    if (!session?.user) return { courses: [], nextCursor: undefined };

    const userId = session.user.id;

    const savedCourses = await prisma.savedCourse.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        where: { userId },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    smallDescription: true,
                    duration: true,
                    price: true,
                    offerPrice: true,
                    level: true,
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
                            userId: userId,
                            status: 'Active' // Fixed string literal type
                        },
                        select: {
                            id: true,
                            status: true,
                            createdAt: true,
                            updatedAt: true,
                            userId: true,
                            courseId: true,
                            amount: true
                        }
                    },
                    savedBy: {
                        where: { userId },
                        select: { id: true }
                    },
                }
            }
        }
    });

    let nextCursor: string | undefined = undefined;
    if (savedCourses.length > limit) {
        const nextItem = savedCourses.pop();
        nextCursor = nextItem?.id;
    }

    // Transform to flat PublicCourseType structure
    const courses = savedCourses.map(item => ({
        ...item.course,
        isSaved: true,
        savedBy: undefined
    }));

    return { courses, nextCursor };
}

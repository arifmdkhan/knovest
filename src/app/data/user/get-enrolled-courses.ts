import { prisma } from "@/lib/db";
import { requireUser } from "./require-user";


export async function getEnrolledCourses() {
    const user = await requireUser()
    const enrolledCourses = await prisma.enrollment.findMany({
        where: {
            userId: user.id,
            status: 'Active'
        },
        select: {
            course: {
                select: {
                    id: true,
                    smallDescription: true,
                    title: true,
                    fileKey: true,
                    level: true,
                    price: true,
                    category: true,
                    slug: true,
                    duration: true,
                    user: {
                        select: {
                            name: true,
                            username: true,
                            image: true,
                            isVerified: true,
                            isSebiVerified: true,
                        }
                    },
                    chapter: {
                        select: {
                            id: true,
                            lessons: {
                                select: {
                                    id: true
                                }
                            }
                        }
                    }

                }
            }
        }
    })

    const coursesWithProgress = await Promise.all(enrolledCourses.map(async (enrollment) => {
        const totalLessons = enrollment.course.chapter.reduce((acc, chapter) => acc + chapter.lessons.length, 0);

        const completedLessonsCount = await prisma.enrolledCourseProgress.count({
            where: {
                userId: user.id,
                isCompleted: true,
                lesson: {
                    chapter: {
                        courseId: enrollment.course.id
                    }
                }
            }
        });

        const progress = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

        return {
            ...enrollment,
            progress
        };
    }));

    return coursesWithProgress;
}

export type EnrolledCourseWithProgress = Awaited<ReturnType<typeof getEnrolledCourses>>[number];
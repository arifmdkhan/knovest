import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getCourseSidebarData(slug: string) {
    const user = await requireUser()

    const course = await prisma.course.findUnique({
        where: {
            slug: slug
        },
        select: {
            id: true,
            title: true,
            fileKey: true,
            duration: true,
            level: true,
            category: true,
            slug: true,
            chapter: {
                orderBy: {
                    position: "asc"
                },
                select: {
                    id: true,
                    title: true,
                    position: true,
                    lessons: {
                        orderBy: {
                            position: "asc"
                        },
                        select: {
                            id: true,
                            title: true,
                            position: true,
                            description: true,
                        }
                    }

                }
            }

        }
    })

    if (!course) {
        return notFound()
    }

    const enrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId: user.id,
                courseId: course.id
            }
        }
    })

    if (!enrollment || enrollment.status !== "Active") {
        return notFound()
    }

    const completedLessons = await prisma.enrolledCourseProgress.findMany({
        where: {
            userId: user.id,
            lesson: {
                chapter: {
                    courseId: course.id
                }
            },
            isCompleted: true
        },
        select: {
            lessonId: true
        }
    })

    const completedLessonIds = completedLessons.map(p => p.lessonId)

    return {
        course,
        completedLessonIds
    }
}

export type CourseSidebarDataType = Awaited<ReturnType<typeof getCourseSidebarData>>


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

    return enrolledCourses
}
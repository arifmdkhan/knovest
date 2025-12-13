import "server-only";

import { prisma } from "@/lib/db";
import { requireCreator } from "./require-creator";

export async function getCreatorEnrollments() {
    const session = await requireCreator();
    const user = session.user;

    const enrollments = await prisma.enrollment.findMany({
        where: {
            course: {
                userId: user.id,
            },
            status: "Active",
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    image: true,
                },
            },
            course: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return enrollments.map((enrollment) => ({
        id: enrollment.id,
        userId: enrollment.user.id,
        name: enrollment.user.name,
        username: enrollment.user.username,
        email: enrollment.user.email,
        image: enrollment.user.image,
        courseName: enrollment.course.title,
        enrollmentDate: enrollment.createdAt,
    }));
}

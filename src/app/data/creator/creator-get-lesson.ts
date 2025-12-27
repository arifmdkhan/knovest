import "server-only";

import { notFound } from "next/navigation";
import { requireCreator } from "./require-creator";
import { prisma } from "@/lib/db";

export async function creatorGetLesson(lessonId: string) {
    await requireCreator();

    const data = await prisma.lesson.findUnique({
        where: {
            id: lessonId,
        },
        select: {
            id: true,
            title: true,
            description: true,
            thumbnailKey: true,
            position: true,
            videoKey: true,
            updatedAt: true,
            resources: true,
        },
    });

    if (!data) {
        return notFound();
    }

    return data;
}

export type CreatorLessonType = Awaited<ReturnType<typeof creatorGetLesson>>;
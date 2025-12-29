import "server-only";
import { prisma } from "@/lib/db";

export async function getPublishedArticles(authorId?: string) {
    const articles = await prisma.article.findMany({
        where: {
            status: "PUBLISHED",
            ...(authorId && { authorId }),
        },
        include: {
            author: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return articles;
}

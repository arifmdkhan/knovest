import "server-only";
import { prisma } from "@/lib/db";

export async function getPublishedArticles(authorId?: string, category?: string) {
    const articles = await prisma.article.findMany({
        where: {
            status: "PUBLISHED",
            ...(authorId && { authorId }),
            ...(category && { category }), // Add category filter
        },
        include: {
            author: { select: { id: true, name: true, username: true, image: true, expertVerificationType: true, accountVerificationType: true } },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return articles;
}

import "server-only";
import { prisma } from "@/lib/db";

export async function getRelatedArticles(category: string, currentArticleId: string) {
    try {
        const relatedArticles = await prisma.article.findMany({
            where: {
                category,
                id: {
                    not: currentArticleId,
                },
                status: "PUBLISHED",
            },
            take: 3,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        name: true,
                        username: true,
                        image: true,
                        expertVerificationType: true,
                        accountVerificationType: true,
                    },
                },
            },
        });

        return relatedArticles;
    } catch (error) {
        console.error("Error fetching related articles:", error);
        return [];
    }
}

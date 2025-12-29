import "server-only";
import { prisma } from "@/lib/db";

export async function getArticleBySlug(slug: string) {
    const article = await prisma.article.findUnique({
        where: {
            slug,
            status: "PUBLISHED",
        },
        include: {
            author: true,
        },
    });

    return article;
}

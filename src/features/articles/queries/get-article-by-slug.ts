import "server-only";
import { prisma } from "@/lib/db";

export async function getArticleBySlug(slug: string) {
    const article = await prisma.article.findUnique({
        where: {
            slug,
            status: "PUBLISHED",
        },
        include: {
            author: { select: { id: true, name: true, username: true, image: true, bio: true, expertVerificationType: true, accountVerificationType: true } },
        },
    });

    return article;
}

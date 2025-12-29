import "server-only";

import { requireUser } from "@/server/data/user/require-user";
import { prisma } from "@/lib/db";

export async function getCreatorArticles() {
    const user = await requireUser();

    const articles = await prisma.article.findMany({
        where: {
            authorId: user.id,
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

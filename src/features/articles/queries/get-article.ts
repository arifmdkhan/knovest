import "server-only";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getArticle(articleId: string) {
    const user = await requireUser();

    const article = await prisma.article.findUnique({
        where: {
            id: articleId,
            authorId: user.id,
        },
    });

    if (!article) {
        return redirect("/academy/creator");
    }

    return article;
}

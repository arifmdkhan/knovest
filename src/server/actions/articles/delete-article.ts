"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function DeleteArticle(articleId: string): Promise<ApiResponse> {
    const user = await requireUser();

    try {
        const existingArticle = await prisma.article.findUnique({
            where: {
                id: articleId,
                authorId: user.id,
            },
        });

        if (!existingArticle) {
            return { status: "error", message: "Article not found or unauthorized." };
        }

        await prisma.article.delete({
            where: {
                id: articleId,
            },
        });

        revalidatePath("/academy/creator");
        return { status: "success", message: "Article deleted successfully." };
    } catch (error) {
        console.error("Failed to delete article:", error);
        return { status: "error", message: "Failed to delete article." };
    }
}

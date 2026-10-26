"use server";

import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { articleSchema, ArticleSchemaType } from "@/features/articles/schemas";
import { ApiResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

export async function UpdateArticle(
    articleId: string,
    values: ArticleSchemaType
): Promise<ApiResponse> {
    const user = await requireUser();

    try {

        const validation = articleSchema.safeParse(values);
        if (!validation.success) {
            return {
                status: "error",
                message: "Invalid data",
            };
        }

        const existingArticleSlug = await prisma.article.findFirst({
            where: {
                slug: validation.data.slug,
                id: {
                    not: articleId,
                },
            },
        });

        if (existingArticleSlug) {
            return {
                status: "error",
                message: "Slug already exists. Please choose a different one.",
            };
        }

        // Verify ownership
        const existingArticle = await prisma.article.findUnique({
            where: {
                id: articleId,
                authorId: user.id,
            },
        });

        if (!existingArticle) {
            return {
                status: "error",
                message: "Article not found or you do not have permission to edit it.",
            };
        }

        const DOMPurify = (await import("isomorphic-dompurify")).default;
        const sanitizedContent = DOMPurify.sanitize(validation.data.content);

        const data = await prisma.article.update({
            where: {
                id: articleId,
            },
            data: {
                ...validation.data,
                content: sanitizedContent,
            },
        });

        revalidatePath("/academy/creator");
        revalidatePath(`/academy/creator/article/${articleId}/edit`);

        return {
            status: "success",
            message: "Article updated successfully",
        };
    } catch (error) {
        console.error("Failed to update article:", error);
        if (error instanceof Error) {
            console.error(error.message);
            console.error(error.stack);
        }
        return {
            status: "error",
            message: "Failed to update article",
        };
    }
}

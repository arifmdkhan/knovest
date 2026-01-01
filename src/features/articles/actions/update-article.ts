"use server";

import { requireUser } from "@/features/user/queries/require-user";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { articleSchema, ArticleSchemaType } from "@/features/articles/schemas";
import { ApiResponse } from "@/types/api";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet
    .withRule(
        fixedWindow({
            mode: "LIVE",
            window: "1m",
            max: 10,
        })
    );

export async function UpdateArticle(
    articleId: string,
    values: ArticleSchemaType
): Promise<ApiResponse> {
    const user = await requireUser();

    try {
        const req = await request();
        const decision = await aj.protect(req, {
            fingerprint: user.id,
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return {
                    status: "error",
                    message: "Too many requests. Please try again later.",
                };
            } else {
                return {
                    status: "error",
                    message:
                        "You are a bot! If this is a mistake, please contact support.",
                };
            }
        }

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

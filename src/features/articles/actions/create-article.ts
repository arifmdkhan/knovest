"use server";

import { requireUser } from "@/features/user/queries/require-user"; // Assuming this exists or I will use a similar auth check
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
            max: 5, // Slightly lower limit for articles maybe? or keep same.
        })
    );



export async function CreateArticle(
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

        const existingArticle = await prisma.article.findUnique({
            where: {
                slug: validation.data.slug,
            },
        });

        if (existingArticle) {
            return {
                status: "error",
                message: "Slug already exists. Please choose a different one.",
            };
        }

        const DOMPurify = (await import("isomorphic-dompurify")).default;
        const sanitizedContent = DOMPurify.sanitize(validation.data.content);

        await prisma.article.create({
            data: {
                ...validation.data,
                content: sanitizedContent, // Override with sanitized version
                id: validation.data.id || undefined,
                authorId: user.id as string,
            },
        });
        return {
            status: "success",
            message: "Article created successfully",
        };
    } catch (error) {
        console.error("Failed to create article:", error);
        return {
            status: "error",
            message: "Failed to create article.",
        };
    }
}

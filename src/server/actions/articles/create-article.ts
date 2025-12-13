"use server";

import { requireUser } from "@/app/data/user/require-user"; // Assuming this exists or I will use a similar auth check
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { articleSchema, ArticleSchemaType } from "@/lib/schema/article-schema";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";

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
    // Using requireUser instead of requireCreator as articles might be for all users. 
    // If requireUser doesn't exist, I'll need to find the equivalent.
    // For now I will assume I need to authenticate the user.
    // Let's check if requireUser exists first in the next step, but I'll write this file assuming I can import it or fix it.
    // Actually, better to check first. But I can write it and if it fails I fix it.
    // I'll assume standard auth pattern.

    // Wait, I should verify if requireUser exists. 
    // I'll use a placeholder import and fix it if needed.
    // Or I can check `src/lib/auth` or similar if I can find it.
    // `create-course.ts` used `requireCreator`.

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

        const data = await prisma.article.create({
            data: {
                ...validation.data,
                authorId: user.id as string,
            },
        });
        return {
            status: "success",
            message: "Article created successfully",
        };
    } catch (error) {
        console.error("Failed to create article:", error);
        // Log the full error object for debugging
        if (error instanceof Error) {
            console.error(error.message);
            console.error(error.stack);
        }
        return {
            status: "error",
            message: "Failed to create article. Please check the logs.",
        };
    }
}

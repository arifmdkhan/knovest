import { z } from "zod";

export const articleSchema = z.object({
    title: z.string().min(5, {
        message: "Title must be at least 5 characters.",
    }),
    slug: z.string().min(5, {
        message: "Slug must be at least 5 characters.",
    }).regex(/^[a-z0-9-]+$/, {
        message: "Slug must only contain lowercase alphanumeric characters and hyphens",
    }),
    content: z.string().min(20, {
        message: "Content must be at least 20 characters.",
    }),
    thumbnailKey: z.string().optional(),
    category: z.string().min(1, {
        message: "Please select a category.",
    }),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    id: z.string().optional(),
});

export type ArticleSchemaType = z.infer<typeof articleSchema>;

export const articleCategories = [
    "Finance",
    "Stocks",
    "F&O",
    "Currencies",
    "Commodities",
    "Investment",
    "Crypto",
    "Other"
] as const;

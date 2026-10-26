import { z } from "zod";

export const createPostSchema = z.object({
    content: z.string().max(10000).optional(),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE", "SUBSCRIBER"]),
    media: z.array(z.object({
        url: z.string().url(),
        key: z.string().optional(),
        type: z.enum(["IMAGE", "VIDEO"]),
        width: z.number().optional(),
        height: z.number().optional(),
    })).max(4).optional(),
    id: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

export type CreatePostSchemaType = z.infer<typeof createPostSchema>;

export const toggleLikeSchema = z.object({
    postId: z.string(),
});

export type ToggleLikeSchemaType = z.infer<typeof toggleLikeSchema>;

export const toggleSaveSchema = z.object({
    postId: z.string(),
});

export type ToggleSaveSchemaType = z.infer<typeof toggleSaveSchema>;

export const deletePostSchema = z.object({
    postId: z.string(),
});

export type DeletePostSchemaType = z.infer<typeof deletePostSchema>;

export const toggleRepostSchema = z.object({
    postId: z.string(),
});

export type ToggleRepostSchemaType = z.infer<typeof toggleRepostSchema>;

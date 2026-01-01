import { z } from "zod";

export const createPostSchema = z.object({
    content: z.string().optional(),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE", "SUBSCRIBER"]),
    media: z.array(z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "VIDEO"]),
        width: z.number().optional(),
        height: z.number().optional(),
    })).max(4).optional(),
    id: z.string().optional(),
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

import { Post, User, Media, Like, Comment, SavedPost } from "@/generated/prisma/client";

export type FeedPost = Post & {
    author: Pick<User, "id" | "name" | "username" | "image" | "isVerified" | "isSebiVerified">;
    media: Media[];
    _count: {
        likes: number;
        comments: number;
        other_Post: number; // Reposts count (mapped from relation)
    };
    hasLiked: boolean;
    isSaved: boolean;
    isReposted: boolean;
    originalPost?: FeedPost | null; // For recursive display
};

export type PostWithRelations = Post & {
    author: User;
    media: Media[];
    likes: Like[];
    comments: Comment[];
    savedBy: SavedPost[];
};

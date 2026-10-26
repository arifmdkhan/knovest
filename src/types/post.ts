import { Post, User, Media } from "@/generated/prisma/client";

export type FeedPost = Post & {
    author: Pick<User, "id" | "name" | "username" | "image" | "expertVerificationType" | "accountVerificationType">;
    media: Media[];
    _count: {
        likes: number;
        comments: number;
        other_Post: number; 
    };
    hasLiked: boolean;
    isSaved: boolean;
    isReposted: boolean;
    originalPost?: FeedPost | null; 
};



export type FeedPage = {
    posts: FeedPost[];
    nextCursor?: string;
};

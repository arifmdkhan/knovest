import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/server/actions/post/create-post";
import { deletePost } from "@/server/actions/post/delete-post";
import { toggleLike } from "@/server/actions/post/toggle-like";
import { toggleSave } from "@/server/actions/post/toggle-save";
import { toggleRepost } from "@/server/actions/post/toggle-repost";
import { CreatePostSchemaType, DeletePostSchemaType, ToggleLikeSchemaType, ToggleSaveSchemaType, ToggleRepostSchemaType } from "@/lib/schema/post-schema";

// ... existing code ...

export const useToggleRepost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: ToggleRepostSchemaType) => {
            const res = await toggleRepost(data);
            if (res.status === "error") throw new Error(res.message);
            return { ...res.data, postId: data.postId };
        },
        onSuccess: (data) => {
            toast.success(data.reposted ? "Reposted" : "Removed repost");

            // Update feed cache
            queryClient.setQueriesData({ queryKey: ["posts", "feed"] }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        posts: page.posts.map((post: FeedPost) => {
                            if (post.id === data.postId) {
                                return {
                                    ...post,
                                    isReposted: data.reposted,
                                    _count: {
                                        ...post._count,
                                        other_Post: data.count
                                    }
                                };
                            }
                            // Also update validation for original post if it's a repost wrapper
                            if (post.originalPost?.id === data.postId) {
                                return {
                                    ...post,
                                    originalPost: {
                                        ...post.originalPost,
                                        isReposted: data.reposted,
                                        _count: {
                                            ...post.originalPost._count,
                                            other_Post: data.count
                                        }
                                    }
                                };
                            }
                            return post;
                        })
                    }))
                };
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to repost");
        }
    });
};
import { toast } from "sonner";
import { FeedPost } from "@/types/post";
export type FeedType = 'FOR_YOU' | 'FOLLOWING' | 'SUBSCRIBED';

export const useGetPosts = (authorId?: string, type: FeedType = 'FOR_YOU', initialData?: { posts: FeedPost[]; nextCursor?: string }) => {
    return useInfiniteQuery({
        queryKey: ["posts", "feed", authorId, type],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            if (pageParam) params.append("cursor", pageParam as string);
            params.append("limit", "10");
            if (authorId) params.append("authorId", authorId);
            params.append("type", type);

            const res = await fetch(`/api/posts?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch posts");
            return res.json();
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
        initialData: initialData ? {
            pages: [initialData],
            pageParams: [undefined]
        } : undefined,
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePostSchemaType) => {
            const res = await createPost(data);
            if (res.status === "error") throw new Error(res.message);
            return res.data;
        },
        onSuccess: (newPost) => {
            toast.success("Post published!");

            // Optimistic update for feed
            queryClient.setQueriesData({ queryKey: ["posts", "feed"] }, (oldData: any) => {
                if (!oldData) return { pages: [{ posts: [newPost], nextCursor: null }], pageParams: [undefined] };

                const firstPage = oldData.pages[0];
                const newFirstPage = {
                    ...firstPage,
                    posts: [newPost, ...firstPage.posts]
                };

                return {
                    ...oldData,
                    pages: [newFirstPage, ...oldData.pages.slice(1)]
                };
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create post");
        }
    });
};

export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: DeletePostSchemaType) => {
            const res = await deletePost(data);
            if (res.status === "error") throw new Error(res.message);
            return data.postId;
        },
        onSuccess: (deletedPostId) => {
            toast.success("Post deleted");

            // Remove from feed
            queryClient.setQueriesData({ queryKey: ["posts", "feed"] }, (oldData: any) => {
                if (!oldData) return oldData;

                const newPages = oldData.pages.map((page: any) => ({
                    ...page,
                    posts: page.posts.filter((post: FeedPost) => post.id !== deletedPostId)
                }));

                return {
                    ...oldData,
                    pages: newPages
                };
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete post");
        }
    });
};

export const useToggleLike = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: ToggleLikeSchemaType) => {
            const res = await toggleLike(data);
            if (res.status === "error") throw new Error(res.message);
            return { ...res.data, postId: data.postId };
        },
        onSuccess: (data) => {
            queryClient.setQueriesData({ queryKey: ["posts", "feed"] }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        posts: page.posts.map((post: FeedPost) => {
                            if (post.id === data.postId) {
                                return {
                                    ...post,
                                    hasLiked: data.liked,
                                    _count: { ...post._count, likes: data.count }
                                };
                            }
                            if (post.originalPost?.id === data.postId) {
                                return {
                                    ...post,
                                    originalPost: {
                                        ...post.originalPost,
                                        hasLiked: data.liked,
                                        _count: { ...post.originalPost._count, likes: data.count }
                                    }
                                };
                            }
                            return post;
                        })
                    }))
                };
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to like post");
        }
    });
};

export const useToggleSave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: ToggleSaveSchemaType) => {
            const res = await toggleSave(data);
            if (res.status === "error") throw new Error(res.message);
            return { ...res.data, postId: data.postId };
        },
        onSuccess: (data) => {
            toast.success(data.saved ? "Saved to bookmarks" : "Removed from bookmarks");

            queryClient.setQueriesData({ queryKey: ["posts", "feed"] }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        posts: page.posts.map((post: FeedPost) => {
                            if (post.id === data.postId) {
                                return { ...post, isSaved: data.saved };
                            }
                            if (post.originalPost?.id === data.postId) {
                                return { ...post, originalPost: { ...post.originalPost, isSaved: data.saved } };
                            }
                            return post;
                        })
                    }))
                };
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save post");
        }
    });
};

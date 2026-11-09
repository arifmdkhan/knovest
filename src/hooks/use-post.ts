import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { createPost } from "@/features/posts/actions/create-post";
import { deletePost } from "@/features/posts/actions/delete-post";
import { toggleLike } from "@/features/posts/actions/toggle-like";
import { toggleSave } from "@/features/posts/actions/toggle-save";
import { toggleRepost } from "@/features/posts/actions/toggle-repost";
import { CreatePostSchemaType, DeletePostSchemaType, ToggleLikeSchemaType, ToggleSaveSchemaType, ToggleRepostSchemaType } from "@/features/posts/schemas";
import { toast } from "sonner";
import { FeedPost } from "@/types/post";
import { contentQueryOptions } from "@/lib/query-client";
export type FeedType = 'FOR_YOU' | 'FOLLOWING' | 'SUBSCRIBED';

interface FeedPage {
    posts: FeedPost[];
    nextCursor?: string | null;
}

import { getFeedPostsAction } from "@/features/posts/actions/get-feed-posts-action";

export const useToggleRepost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: ToggleRepostSchemaType) => {
            const res = await toggleRepost(data);
            if (res.status === "error") throw new Error(res.message);
            return { ...(res.data as { reposted: boolean; count: number }), postId: data.postId };
        },
        onSuccess: (data) => {
            toast.success(data.reposted ? "Reposted" : "Removed repost");

            // Update feed cache
            queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts", "feed"] }, (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
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
        onError: (error: Error) => {
            toast.error(error.message || "Failed to repost");
        }
    });
};


export const useGetPosts = (authorId?: string, type: FeedType = 'FOR_YOU', initialData?: { posts: FeedPost[]; nextCursor?: string }) => {
    return useInfiniteQuery({
        queryKey: ["posts", "feed", authorId, type],
        ...contentQueryOptions,
        queryFn: async ({ pageParam }) => {
            const res = await getFeedPostsAction(
                pageParam as string | undefined,
                10,
                authorId,
                type
            );
            if (res.status === "error") throw new Error(res.message);
            return res.data as FeedPage;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
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
            return res.data as FeedPost;
        },
        onSuccess: (newPost) => {
            toast.success("Post published!");
            queryClient.invalidateQueries({ queryKey: ["posts", "user", newPost.author.id] });

            // Optimistic update for feed
            const queries = queryClient.getQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts", "feed"] });

            queries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;

                const key = queryKey as [string, string, string | undefined, FeedType | undefined];
                const feedAuthorId = key[2];
                const feedType = key[3];

                const isMyProfile = feedAuthorId === newPost.author.id;
                const isGeneralFeed = !feedAuthorId && (feedType === 'FOR_YOU' || feedType === 'FOLLOWING');

                if (isMyProfile || isGeneralFeed) {
                    queryClient.setQueryData(queryKey, (prev: InfiniteData<FeedPage> | undefined) => {
                        if (!prev) return { pages: [{ posts: [newPost], nextCursor: null }], pageParams: [undefined] };

                        const firstPage = prev.pages[0];
                        const newFirstPage = {
                            ...firstPage,
                            posts: [newPost, ...firstPage.posts]
                        };

                        return {
                            ...prev,
                            pages: [newFirstPage, ...prev.pages.slice(1)]
                        };
                    });
                }
            });
        },
        onError: (error: Error) => {
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
            queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts", "feed"] }, (oldData) => {
                if (!oldData) return oldData;

                const newPages = oldData.pages.map((page) => ({
                    ...page,
                    posts: page.posts.filter((post: FeedPost) => post.id !== deletedPostId)
                }));

                return {
                    ...oldData,
                    pages: newPages
                };
            });
        },
        onError: (error: Error) => {
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
            return { ...(res.data as { liked: boolean; count: number }), postId: data.postId };
        },
        onSuccess: (data) => {
            queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts", "feed"] }, (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
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
        onError: (error: Error) => {
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
            return { ...(res.data as { saved: boolean }), postId: data.postId };
        },
        onSuccess: (data) => {
            toast.success(data.saved ? "Saved to bookmarks" : "Removed from bookmarks");

            // Update main feed cache 
            queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts", "feed"] }, (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
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

            // Handle Bookmarks Page Cache
            if (!data.saved) {
                // If unsaving, remove from bookmarks list immediately
                queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts", "bookmarks"] }, (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            posts: page.posts.filter((post: FeedPost) => post.id !== data.postId)
                        }))
                    };
                });
            } else {
                // If saving, invalidate to refetch (simplest way to add to list in correct order)
                queryClient.invalidateQueries({ queryKey: ["posts", "bookmarks"] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save post");
        }
    });
};

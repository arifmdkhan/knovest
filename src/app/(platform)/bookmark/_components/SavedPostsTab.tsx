"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { FeedPost } from "@/types/post";
import { FeedCard } from "../../home/_components/FeedCard";
import { BookmarkEmptyState } from "./BookmarkEmptyState";

const fetchBookmarks = async ({ pageParam }: { pageParam?: string }) => {
    const params = new URLSearchParams();
    if (pageParam) params.append("cursor", pageParam);

    const res = await fetch(`/api/posts/bookmarks?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch bookmarks");
    return res.json();
};

export function SavedPostsTab() {
    const { ref, inView } = useInView();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ["posts", "bookmarks"],
        queryFn: fetchBookmarks,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined as string | undefined,
    });

    useEffect(() => {
        if (inView && hasNextPage) fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage]);

    if (status === "pending") return <FeedSkeleton />;

    if (status === "error") return <div className="text-center py-10 text-destructive">Error loading bookmarks</div>;

    const isEmpty = !data?.pages[0]?.posts.length;

    if (isEmpty) {
        return (
            <BookmarkEmptyState
                icon={Bookmark}
                title="No saved posts yet"
                description="Save interesting posts to your personal collection to read them later or keep for reference."
                actionLabel="Explore Feed"
                actionLink="/home"
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {data.pages.map((page: any, i: number) => (
                <div key={i} className="space-y-6">
                    {page.posts.map((post: FeedPost) => (
                        <FeedCard key={post.id} post={post} />
                    ))}
                </div>
            ))}
            <div ref={ref} className="h-10 flex justify-center p-4">
                {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
            </div>
        </div>
    );
}

function FeedSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2].map((i) => (
                <div key={i} className="bg-card/50 border border-border/60 rounded-xl p-4 space-y-4">
                    <div className="flex gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-40 w-full rounded-md" />
                </div>
            ))}
        </div>
    );
}

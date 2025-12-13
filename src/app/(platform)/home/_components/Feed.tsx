"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { FeedCard } from "./FeedCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPosts, FeedType } from "@/hooks/use-post";
import { EmptyFeedState } from "./EmptyFeedState";
import { useInView } from "react-intersection-observer";

import { FeedPost } from "@/types/post";

export function InfiniteFeed({ type = 'FOR_YOU', initialData }: { type?: FeedType, initialData?: { posts: FeedPost[], nextCursor?: string } }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    status,
  } = useGetPosts(undefined, type, initialData);

  // Flatten pages into a single array of posts
  const allPosts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) || [];
  }, [data]);

  const { ref, inView } = useInView();

  // Load more when the loader comes into view
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  if (isPending) {
    return <FeedSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Failed to load feed. Please try again.
      </div>
    );
  }

  if (allPosts.length === 0) {
    return <EmptyFeedState type={type} />;
  }

  return (
    <div className="space-y-6 pb-8">
      {allPosts.map((post, index) => (
        <FeedCard key={post.id} post={post} priority={index === 0} />
      ))}

      {/* Infinite Scroll Loader / Trigger */}
      {(hasNextPage || isFetchingNextPage) && (
        <div ref={ref} className="h-24 flex items-center justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <span className="sr-only">Load more</span>
          )}
        </div>
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          You&apos;re all caught up!
        </div>
      )}
    </div>
  );
}

// Skeleton Loader (Initial Load only)
export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
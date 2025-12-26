"use client";

import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Grid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";
import { FeedCard } from "../../home/_components/FeedCard";
import { FeedPost } from "@/types/post";

import { getFeedPostsAction } from "@/server/actions/post/get-feed-posts-action";


// Fetcher function updated to accept authorId
import { QueryFunctionContext } from "@tanstack/react-query";

type ProfileFeedQueryKey = ["posts", "user", string];

const fetchUserPosts = async ({ pageParam, queryKey }: QueryFunctionContext) => {
  const [_, __, authorId] = queryKey as ProfileFeedQueryKey; // Extract authorId from queryKey: ["posts", "user", authorId]

  const res = await getFeedPostsAction(
    pageParam as string | undefined,
    10,
    authorId
  );
  return res;
};

export function ProfileFeed({ authorId }: { authorId: string }) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["posts", "user", authorId], // Unique key for this user's feed
    queryFn: fetchUserPosts,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return <FeedSkeleton />;
  }

  if (status === "error") {
    return <div className="text-center py-10 text-muted-foreground">Failed to load posts</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Grid className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">No posts yet</h3>
        <p className="text-muted-foreground max-w-sm">This user hasn&apos;t published any updates.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {posts.map((post: FeedPost) => (
        <FeedCard key={post.id} post={post} />
      ))}

      <div ref={ref} className="h-10 flex items-center justify-center p-4">
        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
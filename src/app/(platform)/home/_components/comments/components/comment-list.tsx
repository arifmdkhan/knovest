"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentItem, Comment } from "./comment-item";

import { getComments } from "@/features/comments/actions/comment.action";

interface CommentListProps {
  postId: string;
  parentId?: string;
}

import { QueryFunctionContext } from "@tanstack/react-query";

type CommentQueryKey = ["comments", string, string | undefined];

const fetchComments = async ({ pageParam, queryKey }: QueryFunctionContext) => {
  const [_, postId, parentId] = queryKey as CommentQueryKey;
  const res = await getComments(postId, parentId, pageParam as string | undefined, 5);
  if (res.status === "error") throw new Error(res.message);
  return res.data;
};

export function CommentList({ postId, parentId }: CommentListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["comments", postId, parentId],
    queryFn: fetchComments,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  if (status === "pending") {
    return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (status === "error") {
    return <div className="text-center text-xs text-destructive py-2">Failed to load comments</div>;
  }

  const comments = data?.pages.flatMap((page) => page?.comments || []) || [];

  if (comments.length === 0) {
    if (parentId) return <div className="text-xs text-muted-foreground py-2 pl-2">No replies yet.</div>;
    return <div className="text-center text-sm text-muted-foreground py-8">No comments yet. Be the first to share your thoughts!</div>;
  }

  return (
    <div className="space-y-1">
      {comments.map((comment: Comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}

      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-xs text-muted-foreground w-full mt-2"
        >
          {isFetchingNextPage ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Load more comments"}
        </Button>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { FeedPost } from "@/types/post";
interface FeedPage {
  posts: FeedPost[];
  nextCursor?: string | null;
}
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Or Input if single line preference
import { createComment } from "@/server/actions/comment"; // Use server action wrapper if preferred for types
import { toast } from "sonner";

interface CreateCommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
}

export function CreateCommentForm({ postId, parentId, onSuccess, autoFocus }: CreateCommentFormProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // Call server action directly
      const res = await createComment({ postId, content, parentId });
      if (res.status === "error") throw new Error(res.message);
      return res.data;
    },
    onSuccess: (newComment) => {
      setContent("");
      onSuccess?.();

      // Invalidating queries to refresh the list of comments
      queryClient.invalidateQueries({ queryKey: ["comments", postId, parentId] });

      // Update feed cache to increment comment count
      // We only do this for top-level comments (no parentId) or if we want to track all comments
      // Usually feed shows total comments, so any comment adds to count.
      // Update feed cache to increment comment count
      // We only do this for top-level comments (no parentId) or if we want to track all comments
      // Usually feed shows total comments, so any comment adds to count.
      // We assume the feed query key is similar to useGetPosts
      queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["posts"] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  _count: { ...post._count, comments: (post._count?.comments || 0) + 1 }
                };
              }
              // Also update if it's an original post inside a repost
              if (post.originalPost?.id === postId) {
                return {
                  ...post,
                  originalPost: {
                    ...post.originalPost,
                    _count: { ...post.originalPost._count, comments: (post.originalPost._count?.comments || 0) + 1 }
                  }
                };
              }
              return post;
            })
          }))
        };
      });

      toast.success("Comment posted");
    },
    onError: () => {
      toast.error("Failed to post comment");
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim()) return;
    mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start w-full">
      <div className="flex-1 relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={parentId ? "Write a reply..." : "Write a comment..."}
          className="min-h-[40px] max-h-[120px] py-2 resize-none bg-muted/30 border-transparent focus:bg-background transition-all pr-10 text-sm"
          autoFocus={autoFocus}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isPending}
          className="absolute right-1 top-1 h-8 w-8 rounded-full"
          variant="ghost"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-primary" />}
        </Button>
      </div>
    </form>
  );
}
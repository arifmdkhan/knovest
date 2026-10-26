"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSavedArticleIds, setArticleSaved } from "@/features/articles/actions/saved-articles.action";
import { toast } from "sonner";

export function SaveArticleButton({ articleId }: { articleId: string }) {
  const client = useQueryClient();
  const { data, isPending: isLoading, isError } = useQuery({ queryKey: ["saved-article-ids"], queryFn: getSavedArticleIds });
  const saved = data?.includes(articleId) || false;
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const result = await setArticleSaved({ articleId, saved: !saved });
      if (result.status === "error") throw new Error(result.message);
      return !saved;
    },
    onSuccess: (next) => {
      client.setQueryData<string[]>(["saved-article-ids"], previous => next ? [...(previous || []), articleId] : previous?.filter(id => id !== articleId));
      client.invalidateQueries({ queryKey: ["articles", "bookmarks"] });
    },
    onError: () => toast.error("Couldn’t save this article. Please try again."),
  });
  return <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label={saved ? "Remove saved article" : "Save article"} aria-pressed={saved} disabled={isPending || isLoading || isError} onClick={() => mutate()}>
    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className={saved ? "size-4 fill-current text-primary" : "size-4"} />}
  </Button>;
}

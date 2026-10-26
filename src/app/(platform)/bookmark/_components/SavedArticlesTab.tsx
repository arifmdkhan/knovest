"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { BookmarkEmptyState } from "./BookmarkEmptyState";
import { getSavedArticles } from "@/features/articles/actions/saved-articles.action";
import { ArticleCard } from "../../academy/article/_components/ArticleCard";
import { Button } from "@/components/ui/button";

export function SavedArticlesTab() {
  const { data, status, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["articles", "bookmarks"], queryFn: ({ pageParam }) => getSavedArticles(pageParam),
    initialPageParam: undefined as string | undefined, getNextPageParam: page => page.nextCursor,
  });
  if (status === "pending") return <div className="flex justify-center p-16" role="status" aria-label="Loading saved articles"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (status === "error") return <div className="app-panel p-10 text-center space-y-4"><p>Couldn’t load your saved articles.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>;
  const articles = data.pages.flatMap(page => page.articles);
  if (!articles.length) return <BookmarkEmptyState icon={FileText} title="No saved articles" description="Build your reading list. Save insightful articles to revisit at your own pace." actionLabel="Explore articles" actionLink="/academy/article" />;
  return <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{articles.map(article => <ArticleCard key={article.id} article={article} />)}</div>{hasNextPage && <div className="text-center"><Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>{isFetchingNextPage ? "Loading…" : "Load more articles"}</Button></div>}</div>;
}

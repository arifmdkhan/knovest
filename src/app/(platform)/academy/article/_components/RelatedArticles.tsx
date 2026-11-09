"use client";

import { useQuery } from "@tanstack/react-query";
import { readRelatedArticles } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { ArticleCard } from "./ArticleCard";


interface RelatedArticlesProps {
    category: string;
    currentArticleId: string;
}

export function RelatedArticles({ category, currentArticleId }: RelatedArticlesProps) {
    const query = useQuery({ queryKey: ["articles", "related", category, currentArticleId], queryFn: () => readRelatedArticles(category, currentArticleId), ...contentQueryOptions });
    const articles = query.data || [];

    if (articles.length === 0) return <QueryFeedback {...query} hasData={query.data !== undefined} />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">
                    More in <span className="text-primary">{category}</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                    <div key={article.id} className="h-[380px]">
                        <ArticleCard article={article} />
                    </div>
                ))}
            </div>
        </div>
    );
}

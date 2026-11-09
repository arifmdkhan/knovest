"use client";

import { useQuery } from "@tanstack/react-query";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { readArticles } from "@/features/content/read-actions";
import { ArticleCard } from "../../academy/article/_components/ArticleCard";
import { FileText } from "lucide-react";

export function ProfileArticles({ authorId }: { authorId: string }) {
    const query = useQuery({ queryKey: ["articles", "profile", authorId], queryFn: () => readArticles({ authorId }), ...contentQueryOptions });
    if (query.isPending) return <PageSkeleton />;
    const feedback = <QueryFeedback {...query} hasData={query.data !== undefined} />;
    if (!query.data) return feedback;
    const articles = query.data;

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                {feedback}
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No articles yet</h3>
                <p className="text-muted-foreground max-w-sm">This user hasn&apos;t published any articles.</p>
            </div>
        );
    }

    return (
        <>
        {feedback}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
            ))}
        </div>
        </>
    );
}
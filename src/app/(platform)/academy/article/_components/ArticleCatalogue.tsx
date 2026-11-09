"use client";

import { AppHero } from "@/components/AppHero";
import { useQuery } from "@tanstack/react-query";
import { readArticles } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ArticleCard } from "./ArticleCard";
import { ArticleCategoryFilter } from "./ArticleCategoryFilter";
import Link from "@/components/AppLink";
import { ArrowLeft } from "lucide-react";

export function ArticleCatalogue({ category }: { category?: string }) {
    const query = useQuery({ queryKey: ["articles", "catalogue", { category }], queryFn: () => readArticles({ category }), ...contentQueryOptions });
    const articles = query.data || [];
    return (
        <div className="w-full">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <Link href="/academy" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
                    </Link>
                </div>


                <AppHero title={<>Academy <span className="text-primary">articles</span></>} description="Perspectives, tutorials, and insights from the Knovest community." />

                <div className="flex justify-end">
                    <ArticleCategoryFilter />
                </div>

                <QueryFeedback {...query} hasData={query.data !== undefined} />
                {query.isPending ? <PageSkeleton /> : !query.data ? null : articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="app-panel text-center py-20 px-6">
                        <p className="text-muted-foreground text-lg mb-2">
                            No articles found {category ? `in "${category}"` : ""}.
                        </p>
                        {category && (
                            <Link href="/academy/article" className="text-primary hover:underline">
                                Clear filters
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

import { ArticleCard } from "./article-card";
import { getRelatedArticles } from "@/server/data/article/get-related-articles";

interface RelatedArticlesProps {
    category: string;
    currentArticleId: string;
}

export async function RelatedArticles({ category, currentArticleId }: RelatedArticlesProps) {
    const articles = await getRelatedArticles(category, currentArticleId);

    if (articles.length === 0) return null;

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

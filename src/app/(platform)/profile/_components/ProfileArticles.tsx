import { getPublishedArticles } from "@/server/data/article/get-published-articles";
import { ArticleCard } from "../../academy/article/_components/article-card";
import { FileText } from "lucide-react";

export async function ProfileArticles({ authorId }: { authorId: string }) {
    const articles = await getPublishedArticles(authorId);

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No articles yet</h3>
                <p className="text-muted-foreground max-w-sm">This user hasn&apos;t published any articles.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
            ))}
        </div>
    );
}

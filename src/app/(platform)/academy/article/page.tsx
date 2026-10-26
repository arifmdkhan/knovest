import { AppHero } from "@/components/AppHero";
import { getPublishedArticles } from "@/features/articles/queries/get-published-articles";
import { ArticleCard } from "./_components/ArticleCard";
import { ArticleCategoryFilter } from "./_components/ArticleCategoryFilter";
import Link from "@/components/AppLink";
import { ArrowLeft } from "lucide-react";

export default async function ArticleListPage(props: { searchParams: Promise<{ category?: string }> }) {
    const searchParams = await props.searchParams;
    const category = searchParams.category;
    const articles = await getPublishedArticles(undefined, category);

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

                {articles.length > 0 ? (
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

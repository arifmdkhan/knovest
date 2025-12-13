import { getPublishedArticles } from "@/app/data/article/get-published-articles";
import { ArticleCard } from "./_components/article-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ArticleListPage() {
    const articles = await getPublishedArticles();

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
            {/* Background Ambient Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                <Link href="/academy" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
                </Link>

                <div className="mb-10 text-center max-w-2xl mx-auto">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                        Academy Articles
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Explore our latest insights, tutorials, and news from the community.
                    </p>
                </div>

                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground text-lg">
                            No articles found. Check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

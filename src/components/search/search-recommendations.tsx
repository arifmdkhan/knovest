import { getSearchRecommendations } from "@/server/data/search/get-search-recommendations";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { PublicCourseCard } from "@/app/(platform)/academy/course/_components/PublicCourseCard";
import { ArticleCard } from "@/app/(platform)/academy/article/_components/article-card";
import { Sparkles, Grid, BookOpen, FileText } from "lucide-react";

export async function SearchRecommendations() {
    const { experts, courses, articles } = await getSearchRecommendations();

    const hasRecommendations = experts.length > 0 || courses.length > 0 || articles.length > 0;

    if (!hasRecommendations) return null;

    return (
        <div className="flex flex-col gap-12 animate-in fade-in-50 duration-500">
            {/* Header / Intro */}
            <div className="text-center space-y-2 mb-4">
                <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-full mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Discover Recommendations</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Handpicked experts, courses, and articles to help you get started.
                </p>
            </div>

            {/* Experts Section */}
            {experts.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                        <Grid className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Verified Experts</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {experts.map((expert) => (
                            <div key={expert.id} className="group p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300">
                                <UserAvatarWithInfo
                                    name={expert.name}
                                    username={expert.username}
                                    image={expert.image}
                                    expertVerificationType={expert.expertVerificationType}
                                    accountVerificationType={expert.accountVerificationType}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Courses Section */}
            {courses.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Recommended Courses</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <PublicCourseCard key={course.id} data={course} />
                        ))}
                    </div>
                </section>
            )}

            {/* Articles Section */}
            {articles.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Trending Articles</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article as any} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

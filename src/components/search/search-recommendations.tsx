"use client";

import { useQuery } from "@tanstack/react-query";
import { readSearchRecommendations } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { PublicCourseCard } from "@/app/(platform)/academy/course/_components/PublicCourseCard";
import { ArticleCard } from "@/app/(platform)/academy/article/_components/ArticleCard";
import { Sparkles, Grid, BookOpen, FileText } from "lucide-react";

export function SearchRecommendations() {
    const query = useQuery({ queryKey: ["search-recommendations"], queryFn: readSearchRecommendations, ...contentQueryOptions });
    if (query.isPending) return <PageSkeleton />;
    const feedback = <QueryFeedback {...query} hasData={query.data !== undefined} />;
    if (!query.data) return feedback;
    const { experts, courses, articles } = query.data;

    const hasRecommendations = experts.length > 0 || courses.length > 0 || articles.length > 0;

    if (!hasRecommendations) return feedback;

    return (
        <div className="flex flex-col gap-12 animate-in fade-in-50 duration-500">
            {feedback}
            {/* Header*/}
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
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

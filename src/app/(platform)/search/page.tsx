import { AppHero } from "@/components/AppHero";
import { SearchDiscovery } from "@/components/search/SearchDiscovery";

import { PublicCourseType } from "@/features/courses/queries/get-all-courses";
import { searchGlobal } from "@/features/search/actions/search.action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { PublicCourseCard } from "../academy/course/_components/PublicCourseCard";
import { ArticleCard } from "../academy/article/_components/ArticleCard";
import { GlobalSearchInput } from "@/components/GlobalSearchInput";
import { Grid, BookOpen, FileText, Search as SearchIcon } from "lucide-react";
import { SearchRecommendations } from "@/components/search/search-recommendations";
import { createMetadata } from "@/lib/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
    title: "Search",
    description: "Explore the Knovest ecosystem. Find expert mentors, comprehensive courses, trending articles, and verified community members to accelerate your trading success.",
});


import { User, Article } from "@/generated/prisma/client";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

type SearchUser = Pick<User, "id" | "name" | "username" | "image" | "expertVerificationType" | "accountVerificationType">;

type SearchArticle = Article & {
    author: Pick<User, "name" | "username" | "image" | "expertVerificationType" | "accountVerificationType">;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q || "";

    const result = await searchGlobal(query);
    let users: SearchUser[] = [];
    let courses: PublicCourseType[] = [];
    let articles: SearchArticle[] = [];

    if (result.status === "success" && result.data) {
        users = result.data.users as SearchUser[];
        courses = result.data.courses as unknown as PublicCourseType[];
        articles = result.data.articles as SearchArticle[];
    }

    const hasResults = users.length > 0 || courses.length > 0 || articles.length > 0;

    return (
        <div className="w-full space-y-7">
            <AppHero centered title={<>Find what you&apos;re <span className="text-primary">looking for</span></>} description="Discover people, courses, and ideas. Your next insight starts here.">
                <div className="mx-auto mt-7 w-full max-w-2xl">
                    <GlobalSearchInput className="max-w-full h-14 text-base shadow-sm border-border rounded-xl bg-card" />
                </div>
            </AppHero>

            {/* Results Section */}
            <div className="max-w-6xl mx-auto w-full">
                {!query ? (
                    <div className="space-y-8 py-3">
                        <SearchDiscovery />
                        <SearchRecommendations />
                    </div>
                ) : !hasResults ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                            <SearchIcon className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No results found</h3>
                        <p className="text-lg">
                            We couldn&apos;t find anything matching &quot;<span className="font-medium text-foreground">{query}</span>&quot;
                        </p>
                        <p className="text-sm mt-2">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <Tabs defaultValue="all" className="w-full space-y-8">
                        <div className="flex justify-center">
                            <TabsList className="grid w-full max-w-md grid-cols-4 h-12 p-1 bg-muted/50 rounded-full">
                                <TabsTrigger value="all" className="rounded-full">All</TabsTrigger>
                                <TabsTrigger value="people" className="rounded-full">People</TabsTrigger>
                                <TabsTrigger value="courses" className="rounded-full">Courses</TabsTrigger>
                                <TabsTrigger value="articles" className="rounded-full">Articles</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="all" className="space-y-16 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            {users.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Grid className="w-6 h-6 text-primary" /> People
                                        </h2>
                                        <span className="text-sm text-muted-foreground">{users.length} results</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {users.slice(0, 6).map((user) => (
                                            <div key={user.id} className="p-4 rounded-xl border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300">
                                                <UserAvatarWithInfo
                                                    name={user.name}
                                                    username={user.username}
                                                    image={user.image}
                                                    expertVerificationType={user.expertVerificationType}
                                                    accountVerificationType={user.accountVerificationType}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {courses.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <BookOpen className="w-6 h-6 text-primary" /> Courses
                                        </h2>
                                        <span className="text-sm text-muted-foreground">{courses.length} results</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {courses.slice(0, 3).map((course) => (
                                            <PublicCourseCard key={course.id} data={course as PublicCourseType} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {articles.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <FileText className="w-6 h-6 text-primary" /> Articles
                                        </h2>
                                        <span className="text-sm text-muted-foreground">{articles.length} results</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {articles.slice(0, 3).map((article) => (
                                            <ArticleCard key={article.id} article={article} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </TabsContent>

                        <TabsContent value="people" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map((user) => (
                                    <div key={user.id} className="p-4 rounded-xl border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300">
                                        <UserAvatarWithInfo
                                            name={user.name}
                                            username={user.username}
                                            image={user.image}
                                            expertVerificationType={user.expertVerificationType}
                                            accountVerificationType={user.accountVerificationType}
                                        />
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="courses" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses.map((course) => (
                                    <PublicCourseCard key={course.id} data={course as PublicCourseType} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="articles" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {articles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}

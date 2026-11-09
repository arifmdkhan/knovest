"use client";

import { useQuery } from "@tanstack/react-query";
import { readArticle } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AuthorBioCard } from "./AuthorBioCard";
import { ShareSection } from "./ShareSection";
import { RelatedArticles } from "./RelatedArticles";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "@/components/AppLink";
import { notFound } from "next/navigation";
import { calculateReadTime } from "@/lib/utils";
import { constructUrl } from "@/lib/construct-url";

export function ArticleContent({ slug }: { slug: string }) {
  const query = useQuery({ queryKey: ["articles", "detail", slug], queryFn: () => readArticle(slug), ...contentQueryOptions });
  if (query.isPending) return <PageSkeleton variant="article" />;
  if (query.data === null) return notFound();
  const feedback = <QueryFeedback {...query} hasData={query.data !== undefined} />;
  if (!query.data) return feedback;
    const article = query.data;

    const thumbnailUrl = constructUrl(article.thumbnailKey || "");
    const readTime = calculateReadTime(article.content);

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>
            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                {feedback}
                <Link
                    href="/academy/article"
                    className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Articles
                </Link>

                <article className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{article.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                                {format(new Date(article.createdAt), "MMMM d, yyyy")}
                            </span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{readTime}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight">
                            {article.title}
                        </h1>
                        <UserAvatarWithInfo
                            name={article.author.name}
                            username={article.author.username}
                            image={article.author.image}
                            expertVerificationType={article.author.expertVerificationType}
                            accountVerificationType={article.author.accountVerificationType}
                        />
                    </div>

                    {article.thumbnailKey && (
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg">
                            <SafeImage
                                src={thumbnailUrl}
                                alt={article.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    <div
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </article>

                <div className="space-y-12 pb-12">
                    <AuthorBioCard author={article.author} />

                    <ShareSection title={article.title} slug={article.slug} />

                    <RelatedArticles
                        category={article.category}
                        currentArticleId={article.id}
                    />
                </div>
            </div>
        </div>
    );
}

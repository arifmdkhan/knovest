import { getArticleBySlug } from "@/features/articles/queries/get-article-by-slug";
import { AuthorBioCard } from "../_components/AuthorBioCard";
import { ShareSection } from "../_components/ShareSection";
import { RelatedArticles } from "../_components/RelatedArticles";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { calculateReadTime } from "@/lib/utils";
import { constructUrl } from "@/lib/construct-url";

interface ArticleDetailPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    const thumbnailUrl = constructUrl(article.thumbnailKey || "");
    const readTime = calculateReadTime(article.content);

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
            {/* Background Ambient Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
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

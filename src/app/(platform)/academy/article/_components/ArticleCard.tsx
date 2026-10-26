"use client";

import { SaveArticleButton } from "./SaveArticleButton";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Article, User } from "@/generated/prisma/client";
import { constructUrl } from "@/lib/construct-url";
import { calculateReadTime } from "@/lib/utils";

import { ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "@/components/AppLink";

interface ArticleCardProps {
    article: Article & {
        author: Pick<User, "name" | "username" | "image" | "expertVerificationType" | "accountVerificationType">;
    };
}

export function ArticleCard({ article }: ArticleCardProps) {
    const thumbnailUrl = constructUrl(article.thumbnailKey);
    const readTime = calculateReadTime(article.content);

    // Simple function to strip HTML tags and truncate text
    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>?/gm, "");
    };

    const description = stripHtml(article.content).slice(0, 150) + "...";

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group border shadow-sm bg-card/50 backdrop-blur-sm py-0 gap-0">
            <Link href={`/academy/article/${article.slug}`} aria-label={`Read ${article.title}`} className="relative block aspect-video w-full bg-muted overflow-hidden">
                {article.thumbnailKey ? (
                    <SafeImage
                        src={thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50">
                        No Thumbnail
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80">
                        {article.category}
                    </Badge>
                </div>
            </Link>
            <CardHeader className="p-5 pb-2 space-y-3">
                <UserAvatarWithInfo
                    name={article.author.name}
                    username={article.author.username}
                    image={article.author.image}
                    expertVerificationType={article.author.expertVerificationType}
                    accountVerificationType={article.author.accountVerificationType}
                    className="hover:no-underline"
                >
                    <span className="text-xs text-muted-foreground">• {readTime}</span>
                </UserAvatarWithInfo>
                <Link href={`/academy/article/${article.slug}`} className="block group-hover:text-primary transition-colors">
                    <h3 className="font-bold text-xl line-clamp-2 leading-tight">
                        {article.title}
                    </h3>
                </Link>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1">
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {description}
                </p>
            </CardContent>
            <CardFooter className="p-5 pt-0 flex gap-2">
                <Link href={`/academy/article/${article.slug}`} className="flex-1">
                    <Button variant="secondary" className="w-full group/btn">
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </Link>
                <SaveArticleButton articleId={article.id} />
            </CardFooter>
        </Card>
    );
}

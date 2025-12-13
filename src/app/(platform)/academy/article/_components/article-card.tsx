"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Article, User } from "@/generated/prisma/client";
import { constructUrl } from "@/lib/construct-url";
import { calculateReadTime } from "@/lib/utils";

import { ArrowRight, Bookmark } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";

interface ArticleCardProps {
    article: Article & {
        author: Pick<User, "name" | "username" | "image" | "isVerified" | "isSebiVerified">;
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
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group border-none shadow-sm bg-card/50 backdrop-blur-sm py-0 gap-0">
            <div className="relative aspect-video w-full bg-muted overflow-hidden">
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
            </div>
            <CardHeader className="p-5 pb-2 space-y-3">
                <UserAvatarWithInfo
                    name={article.author.name}
                    username={article.author.username}
                    image={article.author.image}
                    isVerified={article.author.isVerified}
                    isSebiVerified={article.author.isSebiVerified}
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
                <Button variant="outline" size="icon" className="shrink-0" onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement save functionality
                }}>
                    <Bookmark className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

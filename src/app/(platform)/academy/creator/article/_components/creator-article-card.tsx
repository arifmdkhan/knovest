import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { constructUrl } from "@/lib/construct-url";
import { Article, User } from "@/generated/prisma/client";
import { Edit } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { DeleteArticleButton } from "./delete-article-button";

interface CreatorArticleCardProps {
    article: Article & { author: User };
}

export function CreatorArticleCard({ article }: CreatorArticleCardProps) {
    const thumbnailUrl = constructUrl(article.thumbnailKey);

    return (
        <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group py-0 gap-0">
            <div className="relative aspect-video w-full bg-muted">
                {article.thumbnailKey ? (
                    <SafeImage
                        src={thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No Thumbnail
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge
                        variant={
                            article.status === "PUBLISHED"
                                ? "default"
                                : article.status === "ARCHIVED"
                                    ? "destructive"
                                    : "secondary"
                        }
                    >
                        {article.status}
                    </Badge>
                </div>
            </div>
            <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={article.author.image || ""} />
                        <AvatarFallback>{article.author.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{article.author.name}</span>
                </div>
                <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
                    {article.title}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                    {article.category}
                </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
                {/* Add more details if needed, e.g., views, likes */}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Link
                    href={`/academy/creator/article/${article.id}/edit`}
                    className="flex-1"
                >
                    <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                </Link>
                <DeleteArticleButton articleId={article.id} articleTitle={article.title} />
            </CardFooter>
        </Card>
    );
}

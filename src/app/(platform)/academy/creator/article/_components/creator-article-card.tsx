import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { constructUrl } from "@/lib/construct-url";
import { Article, User } from "@/generated/prisma/client";
import { Edit, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { DeleteArticleButton } from "./delete-article-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CreatorArticleCardProps {
    article: Article & { author: User };
}

export function CreatorArticleCard({ article }: CreatorArticleCardProps) {
    const thumbnailUrl = constructUrl(article.thumbnailKey);

    return (
        <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20 flex flex-col h-full p-0">
            <div className="relative aspect-video w-full bg-muted overflow-hidden">
                {article.thumbnailKey ? (
                    <SafeImage
                        src={thumbnailUrl}
                        alt={article.title}
                        fill
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary/20">
                        No Thumbnail
                    </div>
                )}

                {/* Overlay & Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 left-3 z-10">
                    <Badge
                        variant={
                            article.status === "PUBLISHED"
                                ? "default"
                                : article.status === "ARCHIVED"
                                    ? "destructive"
                                    : "secondary"
                        }
                        className="shadow-sm backdrop-blur-md"
                    >
                        {article.status}
                    </Badge>
                </div>

                {/* Actions Menu */}
                <div className="absolute top-3 right-3 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background shadow-sm">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href={`/academy/creator/article/${article.id}/edit`}>
                                    <Pencil className="size-4 mr-2" />
                                    Edit Article
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteArticleButton
                                articleId={article.id}
                                articleTitle={article.title}
                                asDropdownItem
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CardContent className="flex-1 p-4 space-y-3">
                <div className="space-y-1.5">
                    <Link href={`/academy/creator/article/${article.id}/edit`} className="block">
                        <h3 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {article.title}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground border-border/50 bg-secondary/30">
                            {article.category}
                        </Badge>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto">
                <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-3">
                    <UserAvatarWithInfo
                        name={article.author.name}
                        username={article.author.username}
                        image={article.author.image}
                        expertVerificationType={article.author.expertVerificationType}
                        accountVerificationType={article.author.accountVerificationType}
                        className="flex-1 min-w-0"
                        avatarClassName="h-8 w-8"
                    />

                    <Link href={`/academy/creator/article/${article.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-2 h-8">
                            <Edit className="size-3.5" />
                            <span>Edit</span>
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}

"use client";

import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { constructUrl } from "@/lib/construct-url";
import { ArrowRight, BarChart, Clock, Star, Share2, Bookmark } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { ShareDialog } from "@/components/share-dialog";
import { useState, useEffect } from "react";

interface PublicCourseCardProps {
    data: PublicCourseType
}

export function PublicCourseCard({ data }: PublicCourseCardProps) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const thumbnailUrl = constructUrl(data.fileKey)

    const totalReviews = data.reviews.length;
    const averageRating =
        totalReviews > 0
            ? data.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

    const shareUrl = `${baseUrl}/academy/course/${data.slug}`;

    return (
        <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20 flex flex-col h-full p-0">
            {/* Image Section */}
            <div className="relative aspect-video overflow-hidden">
                <SafeImage
                    width={600}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={thumbnailUrl}
                    alt={data.title}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-background/80 border-none">
                        {data.category}
                    </Badge>
                </div>
            </div>

            <CardContent className="flex-1 p-4 space-y-3">
                {/* Title & Description */}
                <div className="space-y-1.5">
                    <Link href={`/academy/course/${data.slug}`} className="block">
                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {data.title}
                        </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {data.smallDescription}
                    </p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                        <Clock className="size-3.5" />
                        <span>{data.duration}h</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                        <BarChart className="size-3.5" />
                        <span>{data.level}</span>
                    </div>
                    {totalReviews > 0 && (
                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                            <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{averageRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({totalReviews})</span>
                        </div>
                    )}
                    <div className="ml-auto font-bold text-foreground text-base">
                        ₹{data.price}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-3">
                <div className="w-full h-px bg-border/50" />

                <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex-1 min-w-0">
                        <UserAvatarWithInfo
                            name={data.user.name}
                            username={data.user.username}
                            image={data.user.image}
                            isVerified={data.user.isVerified}
                            isSebiVerified={data.user.isSebiVerified}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-primary/10 hover:text-primary shrink-0 h-8 w-8"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsShareOpen(true);
                            }}
                        >
                            <Share2 className="size-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-primary/10 hover:text-primary shrink-0 h-8 w-8"
                            onClick={(e) => {
                                e.preventDefault();
                                // TODO: Implement save functionality
                            }}
                        >
                            <Bookmark className="size-4" />
                        </Button>

                        <Link
                            href={`/academy/course/${data.slug}`}
                            className={buttonVariants({
                                variant: "ghost",
                                size: "icon",
                                className: "rounded-full hover:bg-primary/10 hover:text-primary shrink-0 h-8 w-8"
                            })}
                        >
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </CardFooter>

            <ShareDialog
                isOpen={isShareOpen}
                onOpenChange={setIsShareOpen}
                url={shareUrl}
                title={`Check out this course: ${data.title}`}
            />
        </Card>
    )
}

export function PublicCourseCardSkeleton() {
    return (
        <Card className="overflow-hidden border-border/50 bg-card/50 h-full flex flex-col">
            <div className="relative aspect-video">
                <Skeleton className="w-full h-full" />
                <div className="absolute top-3 left-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>

            <CardContent className="flex-1 p-5 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <Skeleton className="h-7 w-16 rounded-md" />
                    <Skeleton className="h-7 w-20 rounded-md" />
                    <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 mt-auto flex flex-col gap-4">
                <div className="w-full h-px bg-border/50" />
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <Skeleton className="size-10 rounded-full" />
                </div>
            </CardFooter>
        </Card>
    )
}

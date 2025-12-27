"use client";

import { useState } from "react";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { constructUrl } from "@/lib/construct-url";
import { BarChart, Clock, Star, Bookmark } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { useToggleSaveCourse } from "@/hooks/use-course";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublicCourseCardProps {
    data: PublicCourseType & { isSaved?: boolean } // Adding isSaved explicitly to TS check if not inferred
}

export function PublicCourseCard({ data }: PublicCourseCardProps) {
    const thumbnailUrl = constructUrl(data.fileKey)
    const { data: session } = authClient.useSession();
    const { mutate: toggleSave, isPending: isSaving } = useToggleSaveCourse();
    const [isSaved, setIsSaved] = useState(!!data.isSaved);

    const totalReviews = data.reviews.length;
    const averageRating =
        totalReviews > 0
            ? data.reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

    const handleSave = () => {
        if (!session) {
            toast.error("Please login to save courses");
            return;
        }

        const previousState = isSaved;
        setIsSaved(!isSaved);

        toggleSave({ courseId: data.id }, {
            onSuccess: (resData) => {
                setIsSaved(!!resData.saved);
            },
            onError: () => {
                setIsSaved(previousState);
            }
        });
    };

    return (
        <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20 flex flex-col h-full p-0 relative">
            <Link href={`/academy/course/${data.slug}`} className="absolute inset-0 z-0" />

            {/* Image Section */}
            <div className="relative aspect-video overflow-hidden z-10 pointer-events-none">
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
                    {data.enrollment && data.enrollment.length > 0 && data.enrollment[0].status === 'Active' && (
                        <Badge className="shadow-sm backdrop-blur-md bg-primary text-primary-foreground border-none">
                            Enrolled
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className="flex-1 p-4 pt-0 pb-2 space-y-2 flex flex-col z-10 pointer-events-none">
                {/* Title & Description */}
                <div className="space-y-1.5">
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {data.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {data.smallDescription}
                    </p>
                </div>

                {/* Meta Info & Price */}
                <div className="flex flex-col gap-3 mt-auto">
                    <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md whitespace-nowrap">
                            <Clock className="size-3.5" />
                            <span>{data.duration}h</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md whitespace-nowrap">
                            <BarChart className="size-3.5" />
                            <span>{data.level}</span>
                        </div>
                        {totalReviews > 0 && (
                            <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md whitespace-nowrap">
                                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                                <span>{averageRating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({totalReviews})</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2">
                        {data.offerPrice && data.offerPrice < data.price ? (
                            <div className="flex flex-col w-full">
                                <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 tracking-wider">
                                    {Math.round(((data.price - data.offerPrice) / data.price) * 100)}% Discount
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-xl text-primary">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.offerPrice)}
                                    </span>
                                    <span className="text-xs text-muted-foreground line-through">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.price)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="font-bold text-xl text-primary">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.price)}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-2 z-10">
                <div className="w-full h-px bg-border/50" />

                <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex-1 min-w-0 relative z-20">
                        <UserAvatarWithInfo
                            name={data.user.name}
                            username={data.user.username}
                            image={data.user.image}
                            expertVerificationType={data.user.expertVerificationType}
                            accountVerificationType={data.user.accountVerificationType}
                        />
                    </div>

                    <div className="flex items-center gap-2 relative z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSaving}
                            className={cn(
                                "rounded-full hover:bg-primary/10 hover:text-primary shrink-0 h-8 w-8 transition-colors",
                                isSaved && "text-primary hover:text-primary/90"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSave();
                            }}
                        >
                            <Bookmark className={cn("size-4", isSaved && "fill-current")} />
                        </Button>
                    </div>
                </div>
            </CardFooter>
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

                <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                </div>

                <div className="pt-3 mt-auto">
                    <div className="border-t border-border/50 pt-3 flex flex-col gap-2">
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <div className="flex items-baseline gap-2">
                            <Skeleton className="h-7 w-24 rounded" />
                            <Skeleton className="h-4 w-16 rounded" />
                        </div>
                    </div>
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

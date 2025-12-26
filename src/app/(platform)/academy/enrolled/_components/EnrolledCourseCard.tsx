import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { constructUrl } from "@/lib/construct-url";
import { BarChart, Clock, PlayCircle } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { cn } from "@/lib/utils";

import { EnrolledCourseWithProgress } from "@/app/data/user/get-enrolled-courses";
import { Progress } from "@/components/ui/progress";

interface EnrolledCourseCardProps {
    data: EnrolledCourseWithProgress['course']
    progress: number
}

export function EnrolledCourseCard({ data, progress }: EnrolledCourseCardProps) {
    const thumbnailUrl = constructUrl(data.fileKey)

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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-background/80 border-none">
                        {data.category}
                    </Badge>
                </div>
            </div>

            <CardContent className="flex-1 p-4 space-y-2">
                {/* Title & Description */}
                <div className="space-y-1.5">
                    <Link href={`/academy/enrolled/${data.slug}`} className="block">
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
                </div>
            </CardContent>

            <div className="px-4 pb-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="font-medium">Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>

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
                </div>
                <Link
                    href={`/academy/enrolled/${data.slug}`}
                    className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full font-semibold gap-2")}
                >
                    <PlayCircle className="size-4" />
                    Go to Course
                </Link>
            </CardFooter>
        </Card>
    )
}

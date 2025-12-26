import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, PlayCircle, Lock } from "lucide-react";
import Link from "next/link";

interface LessonItemProps {
    lesson: {
        id: string;
        title: string;
        position: number;
        description: string | null;
    }
    slug: string;
    isActive?: boolean;
    isCompleted?: boolean;
}

export function LessonItem({ lesson, slug, isActive, isCompleted }: LessonItemProps) {
    const completed = isCompleted;

    return (
        <Link href={`/academy/enrolled/${slug}/${lesson.id}`} className={cn(
            "group flex items-start gap-3 p-3 rounded-lg transition-all duration-200 border border-transparent",
            isActive
                ? "bg-primary/10 border-primary/20 shadow-sm"
                : "hover:bg-muted/50 hover:border-border/50",
            completed && "opacity-75 hover:opacity-100"
        )}>
            <div className="shrink-0 mt-0.5">
                {completed ? (
                    <div className="size-5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center ring-1 ring-green-500/30">
                        <Check className="size-3" />
                    </div>
                ) : isActive ? (
                    <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/20">
                        <PlayCircle className="size-3 fill-current" />
                    </div>
                ) : (
                    <div className="size-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors flex items-center justify-center">
                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            {lesson.position}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <p className={cn(
                    "text-sm font-medium leading-tight transition-colors line-clamp-2",
                    isActive ? "text-primary" : "text-foreground group-hover:text-foreground/90",
                    completed && "text-muted-foreground line-through decoration-green-500/50"
                )}>
                    {lesson.title}
                </p>

                <div className="flex items-center gap-2 text-[10px]">
                    {isActive && (
                        <span className="text-primary font-semibold animate-pulse">
                            Now Playing
                        </span>
                    )}
                    {completed && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            Completed
                        </span>
                    )}
                    {!isActive && !completed && (
                        <span className="text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                            10 min
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
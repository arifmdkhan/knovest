'use client'

import { CourseSidebarDataType } from "@/features/courses/queries/get-course-sidebar-data";
import { ChevronDown, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { LessonItem } from "./LessonItem";
import { usePathname } from "next/navigation";


interface CourseSidebarProps {
    course: CourseSidebarDataType['course']
    completedLessonIds: string[];
}

export function CourseSidebar({ course, completedLessonIds }: CourseSidebarProps) {
    const pathname = usePathname()
    const currentLessonId = pathname.split('/').pop()

    // Calculate progress
    const totalLessons = course.chapter.reduce((acc, chapter) => acc + chapter.lessons.length, 0);
    const completedLessons = completedLessonIds.length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border/50">
            {/* Header */}
            <div className="p-6 border-b border-border/50 space-y-6">
                <div className="space-y-2">
                    <h1 className="font-bold text-xl leading-tight text-foreground line-clamp-2">
                        {course.title}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {course.category}
                    </p>
                </div>

                <div className="space-y-3 bg-secondary/30 p-4 rounded-xl border border-border/50">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                            <Trophy className="size-4" />
                            <span>Your Progress</span>
                        </div>
                        <span className="text-muted-foreground font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-secondary" />
                    <p className="text-xs text-muted-foreground text-center">
                        {completedLessons} of {totalLessons} lessons completed
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="p-4 space-y-4">
                    {course.chapter.map((chapter, index) => (
                        <Collapsible key={chapter.id} defaultOpen={index === 0} className="group">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant='ghost'
                                    className="w-full p-3 h-auto flex items-center justify-between hover:bg-secondary/50 rounded-lg transition-all duration-200 group-data-[state=open]:bg-secondary/30"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-data-[state=open]:bg-primary/20 transition-colors">
                                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className="text-sm font-semibold truncate text-foreground">
                                                {chapter.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {chapter.lessons.length} Lessons
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2 pb-4 pl-4 pr-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="border-l-2 border-border/50 pl-4 space-y-1">
                                    {chapter.lessons.map((lesson) => (
                                        <LessonItem
                                            key={lesson.id}
                                            lesson={lesson}
                                            slug={course.slug}
                                            isActive={currentLessonId === lesson.id}
                                            isCompleted={completedLessonIds.includes(lesson.id)}
                                        />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </div>
        </div>
    )
}
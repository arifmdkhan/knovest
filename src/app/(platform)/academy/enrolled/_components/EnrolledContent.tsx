"use client";

import { AppHero } from "@/components/AppHero";
import { SavedArticlesTab } from "../../../bookmark/_components/SavedArticlesTab";
import { EmptyState } from "@/components/EmptyState";
import Link from "@/components/AppLink"
import { EnrolledCourseCard } from "./EnrolledCourseCard";
import { PublicCourseCard } from "../../course/_components/PublicCourseCard";
import { useQuery } from "@tanstack/react-query";
import { readCourses, readEnrolledCourses } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, LayoutGrid } from "lucide-react";

export function EnrolledContent() {
    const courses = useQuery({ queryKey: ["courses", {}], queryFn: () => readCourses(), ...contentQueryOptions });
    const enrolled = useQuery({ queryKey: ["enrolled-courses"], queryFn: readEnrolledCourses, ...contentQueryOptions });
    if (enrolled.isPending) return <PageSkeleton />;
    const feedback = <QueryFeedback {...enrolled} hasData={enrolled.data !== undefined} />;
    if (!enrolled.data) return feedback;
    const allCourses = courses.data || [];
    const enrolledCourses = enrolled.data;
    const recommendedCourses = allCourses.filter((course) => !enrolledCourses.some(({ course: enrolled }) => enrolled.id === course.id));

    return (
        <div className="w-full space-y-7">
            {feedback}
            <AppHero title={<>My <span className="text-primary">learning</span></>} description="A little progress, every day. Continue your courses and explore something new." />

            <Tabs defaultValue="courses" className="w-full space-y-8">
                <TabsList className="bg-muted/50 p-1 h-auto">
                    <TabsTrigger value="courses" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <GraduationCap className="size-4" />
                        Enrolled Courses
                    </TabsTrigger>
                    <TabsTrigger value="articles" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BookOpen className="size-4" />
                        Articles
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="courses" className="space-y-12 outline-none animate-in fade-in-50 duration-500">
                    {/* Enrolled Courses Section */}
                    <div className="space-y-6">
                        {enrolledCourses.length === 0 ? (
                            <EmptyState
                                title="No Enrolled Courses"
                                description="You haven't enrolled in any courses yet. Start your learning journey today!"
                                buttonText="Browse Courses"
                                href="/academy/course"
                                icon={GraduationCap}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {enrolledCourses.map((item) => (
                                    <EnrolledCourseCard key={item.course.id} data={item.course as any} progress={item.progress} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recommended Courses Section */}
                    {recommendedCourses.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-border/50">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="size-5 text-primary" />
                                <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommendedCourses.slice(0, 3).map((course) => (
                                    <PublicCourseCard key={course.id} data={course} />
                                ))}
                            </div>
                            <div className="flex justify-center pt-4">
                                <Link href="/academy/course" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    View all courses →
                                </Link>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="articles" className="space-y-6 outline-none animate-in fade-in-50 duration-500">
                    <SavedArticlesTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
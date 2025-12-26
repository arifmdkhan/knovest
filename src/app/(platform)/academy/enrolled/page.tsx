import { EmptyState } from "@/components/empty-state"
import Link from "next/link"
import { EnrolledCourseCard } from "./_components/EnrolledCourseCard"
import { PublicCourseCard } from "../course/_components/PublicCourseCard"
import { getEnrolledCourses } from "@/app/data/user/get-enrolled-courses"
import { getAllCourses } from "@/app/data/course/get-all-courses"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, GraduationCap, LayoutGrid } from "lucide-react"

export default async function EnrolledPage() {
    const [allCourses, enrolledCourses] = await Promise.all([
        getAllCourses(),
        getEnrolledCourses()
    ])

    const recommendedCourses = allCourses.filter((course) => !enrolledCourses.some(({ course: enrolled }) => enrolled.id === course.id));

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
                <p className="text-muted-foreground">Manage your courses and track your progress</p>
            </div>

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
                    <EmptyState
                        title="No Articles Saved"
                        description="You haven't saved any articles yet. Explore our library to find interesting reads."
                        buttonText="Browse Articles"
                        href="/academy/article"
                        icon={BookOpen}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
import { ReactNode } from "react";
import { CourseSidebar } from "../_components/CourseSidebar";
import { MobileCourseSidebar } from "../_components/MobileCourseSidebar";
import { getCourseSidebarData } from "@/features/courses/queries/get-course-sidebar-data";

interface CourseLayoutProps {
    params: Promise<{ slug: string }>
    children: ReactNode

}

export default async function CourseLayout({ children, params }: CourseLayoutProps) {
    const { slug } = await params;
    const courseSidebarData = await getCourseSidebarData(slug)


    return (
        <div className="app-panel flex h-[calc(100svh-8rem)] min-h-[480px] overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 border-r border-border/50 shrink-0 h-full">
                <CourseSidebar course={courseSidebarData.course} completedLessonIds={courseSidebarData.completedLessonIds} />
            </div>

            {/* Main Content */}
            <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b border-border/50 flex items-center gap-4 bg-background/80 backdrop-blur-md z-10">
                    <MobileCourseSidebar course={courseSidebarData.course} completedLessonIds={courseSidebarData.completedLessonIds} />
                    <span className="font-semibold truncate text-sm">{courseSidebarData.course.title}</span>
                </div>

                <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {children}
                </main>
            </div>
        </div>
    )
}
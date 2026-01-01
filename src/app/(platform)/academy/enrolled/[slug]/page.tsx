import { getCourseSidebarData } from "@/features/courses/queries/get-course-sidebar-data";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function EnrolledCoursePage({ params }: PageProps) {
    const { slug } = await params;
    const { course } = await getCourseSidebarData(slug);

    if (course.chapter.length > 0 && course.chapter[0].lessons.length > 0) {
        const firstLessonId = course.chapter[0].lessons[0].id;
        redirect(`/academy/enrolled/${slug}/${firstLessonId}`);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No content available for this course yet.</p>
        </div>
    );
}
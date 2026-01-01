import { getAllCourses } from "@/features/courses/queries/get-all-courses";
import { PublicCourseCard } from "../../academy/course/_components/PublicCourseCard";
import { BookOpen } from "lucide-react";

export async function ProfileCourses({ authorId }: { authorId: string }) {
    const courses = await getAllCourses(authorId);

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No courses yet</h3>
                <p className="text-muted-foreground max-w-sm">This user hasn&apos;t published any courses.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
                <PublicCourseCard key={course.id} data={course} />
            ))}
        </div>
    );
}

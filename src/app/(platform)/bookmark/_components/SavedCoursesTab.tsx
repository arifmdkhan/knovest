"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BookOpen, Loader2 } from "lucide-react";
import { BookmarkEmptyState } from "./BookmarkEmptyState";
import { PublicCourseCard, PublicCourseCardSkeleton } from "../../academy/course/_components/PublicCourseCard";
import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { getSavedCoursesAction } from "@/server/actions/course/get-saved-courses-action";

export function SavedCoursesTab() {
    const { ref, inView } = useInView();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ["courses", "bookmarks"],
        queryFn: async ({ pageParam }) => {
            const res = await getSavedCoursesAction(pageParam as string | undefined);
            return res;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined as string | undefined,
    });

    useEffect(() => {
        if (inView && hasNextPage) fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage]);

    if (status === "pending") return <CoursesSkeleton />;

    if (status === "error") return <div className="text-center py-10 text-destructive">Error loading courses</div>;

    const isEmpty = !data?.pages[0]?.courses.length;

    if (isEmpty) {
        return (
            <BookmarkEmptyState
                icon={BookOpen}
                title="No saved courses"
                description="Your learning journey starts here. Bookmark courses to build your personal curriculum."
                actionLabel="Browse Academy"
                actionLink="/academy"
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.pages.map((page: { courses: PublicCourseType[]; nextCursor?: string }) => (
                    page.courses.map((course: PublicCourseType) => (
                        <PublicCourseCard key={course.id} data={course} />
                    ))
                ))}
            </div>

            <div ref={ref} className="h-10 flex justify-center p-4 w-full">
                {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
            </div>
        </div>
    );
}

function CoursesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-full">
                    <PublicCourseCardSkeleton />
                </div>
            ))}
        </div>
    );
}


import { AppHero } from "@/components/AppHero";
import { courseLevels } from "@/features/courses/schemas";
import { getAllCourses } from '@/features/courses/queries/get-all-courses';
import { Suspense } from 'react';
import { PublicCourseCard, PublicCourseCardSkeleton } from './_components/PublicCourseCard';
import { CategoryFilter } from "./_components/CategoryFilter";
import Link from "@/components/AppLink"
import { ArrowLeft } from 'lucide-react';


export default async function PublicCourseRoute({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; level?: string; sort?: string }> }) {
    const { category, q, level, sort } = await searchParams
    const validLevel = courseLevels.find(value => value === level);
    return (
        <div className='w-full space-y-6'>
            <Link href="/academy" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors min-h-11">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
            </Link>
            <AppHero title={<>Explore <span className="text-primary">courses</span></>} description="Learn from verified experts. Build skills that stay with you." />

            <CategoryFilter />

            <Suspense fallback={<LoadingSkeletonLayout />}>
                <RenderCourses category={category} q={q} level={validLevel} sort={sort} />
            </Suspense>
        </div>
    )
}


import { getServerSession } from "@/lib/get-sessions";

async function RenderCourses({ category, q, level, sort }: { category?: string; q?: string; level?: typeof courseLevels[number]; sort?: string }) {
    const session = await getServerSession();
    const courses = await getAllCourses(undefined, category, session?.user?.id, { query: q, level, sort })

    if (courses.length === 0) {
        return (
            <div className="app-panel text-center py-20 px-6">
                <h3 className="text-xl font-semibold text-muted-foreground">No courses found</h3>
                <p className="text-muted-foreground mt-2">Try another search or category, or check back for new courses.</p>
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5'>
            {courses.map((course) => (
                <PublicCourseCard key={course.id} data={course} />
            ))}
        </div>
    )

}


function LoadingSkeletonLayout() {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5'>
            {Array.from({ length: 6 }).map((_, index) => (
                <PublicCourseCardSkeleton key={index} />
            ))}
        </div>
    )
}
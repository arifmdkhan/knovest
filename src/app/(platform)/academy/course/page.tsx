import { getAllCourses } from '@/server/data/course/get-all-courses'
import React, { Suspense } from 'react'
import { PublicCourseCard, PublicCourseCardSkeleton } from './_components/PublicCourseCard'
import { CategoryFilter } from './_components/category-filter'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'


export default async function PublicCourseRoute({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
    const { category } = await searchParams
    return (
        <div className='container mx-auto px-4 py-12 max-w-7xl'>
            <Link href="/academy" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
            </Link>
            <div className='flex flex-col space-y-4 mb-12 text-center'>
                <h1 className='text-4xl md:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                    Explore Courses
                </h1>
                <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                    Discover a curated selection of courses led by verified experts, built to help you develop real trading and investment skills.
                </p>
            </div>

            <CategoryFilter />

            <Suspense fallback={<LoadingSkeletonLayout />}>
                <RenderCourses category={category} />
            </Suspense>
        </div>
    )
}


import { getServerSession } from "@/lib/get-sessions";

async function RenderCourses({ category }: { category?: string }) {
    const session = await getServerSession();
    const courses = await getAllCourses(undefined, category, session?.user?.id)

    if (courses.length === 0) {
        return (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-card/50">
                <h3 className="text-xl font-semibold text-muted-foreground">No courses found</h3>
                <p className="text-muted-foreground mt-2">Check back later for new content.</p>
            </div>
        )
    }

    return (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6'>
            {courses.map((course) => (
                <PublicCourseCard key={course.id} data={course} />
            ))}
        </div>
    )

}


function LoadingSkeletonLayout() {
    return (
        <div className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6'>
            {Array.from({ length: 6 }).map((_, index) => (
                <PublicCourseCardSkeleton key={index} />
            ))}
        </div>
    )
}
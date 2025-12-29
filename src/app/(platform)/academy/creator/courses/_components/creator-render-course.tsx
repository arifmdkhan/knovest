
import { creatorGetCourses } from '@/server/data/creator/creator-get-courses';
import { EmptyState } from '@/components/empty-state';
import CreatorCourseCard, { CreatorCourseCardSkeleton } from './creator-course-card';


export async function RenderCourses() {
  const data = await creatorGetCourses();

  return (
    <>
      {data.length === 0 ? (
        <EmptyState title='No course found' description='Create a new course to get started' buttonText='Create Course' href='/academy/creator/courses/create' />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {data.map((course) => (
            <CreatorCourseCard key={course.id} data={course} />
          ))}
        </div>
      )

      }
    </>
  )


}


export function CreatorCourseCardSkeletonLayout() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.from({ length: 6 }).map((_, index) => (
        <CreatorCourseCardSkeleton key={index} />

      ))

      }

    </div>
  )
}
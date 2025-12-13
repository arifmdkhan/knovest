
import { creatorGetCourses } from '@/app/data/creator/creator-get-courses';
import { EmptyState } from '@/components/empty-state';
import CreatorCourseCard, { CreatorCourseCardSkeleton } from './creator-course-card';


export async function RenderCourses() {
  const data = await creatorGetCourses();

  return (
    <>
      {data.length === 0 ? (
        <EmptyState title='No course found' description='Create a new course to get started' buttonText='Create Course' href='/academy/creator/courses/create' />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7'>
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
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-7'>
      {Array.from({ length: 4 }).map((_, index) => (
        <CreatorCourseCardSkeleton key={index} />

      ))

      }

    </div>
  )
}
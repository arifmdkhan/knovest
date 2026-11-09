import { CourseContent } from "./_components/CourseContent";

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CourseContent slug={(await params).slug} />;
}

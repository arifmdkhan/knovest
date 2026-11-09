import { CourseCatalogue } from "./_components/CourseCatalogue";

export default async function PublicCourseRoute({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; level?: string; sort?: string }> }) {
  return <CourseCatalogue filters={await searchParams} />;
}

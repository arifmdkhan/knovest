import { lessonMediaResponse } from "@/features/courses/media-response";
export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  return lessonMediaResponse(courseId, lessonId);
}

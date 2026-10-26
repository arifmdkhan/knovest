import { lessonMediaResponse } from "@/features/courses/media-response";
export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string; lessonId: string; file: string }> }) {
  const { courseId, lessonId, file } = await params;
  return lessonMediaResponse(courseId, lessonId, file);
}

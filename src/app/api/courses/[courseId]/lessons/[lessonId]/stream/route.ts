import { requireUser } from "@/features/user/queries/require-user";
import { prisma } from "@/lib/db";
import { StorageService } from "@/lib/storage/storage-service";
import { NextRequest, NextResponse } from "next/server";

interface Params {
    params: Promise<{
        courseId: string;
        lessonId: string;
    }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { courseId, lessonId } = await params;
        // 1. Authorization
        let user;
        try {
            user = await requireUser();
        } catch (e) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Verify Enrollment or Ownership
        // Check if user is the author OR has an active enrollment
        const hasAccess = await prisma.course.findFirst({
            where: {
                id: courseId,
                OR: [
                    { userId: user.id }, // Is Author
                    {
                        enrollment: {
                            some: {
                                userId: user.id,
                                status: "Active"
                            }
                        }
                    }
                ]
            }
        });

        if (!hasAccess) {
            return new NextResponse("Forbidden: You must be enrolled to view this content", { status: 403 });
        }

        // 2. key from Lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId, chapter: { courseId } }, // Ensure lesson belongs to course
            select: { videoKey: true }
        });

        if (!lesson || !lesson.videoKey) {
            return new NextResponse("Video not found", { status: 404 });
        }

        // 3. Generate Presigned URL
        // Short expiration (e.g., 15 minutes) to allow buffering but prevent long-term sharing
        const presignedUrl = await StorageService.getPresignedDownloadUrl(lesson.videoKey, 900); // 900s = 15m

        // 4. Redirect to the presigned URL
        // Using 307 Temporary Redirect preserves the method and body (though GET has no body)
        return NextResponse.redirect(presignedUrl);

    } catch (error) {
        console.error("[STREAM_API_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

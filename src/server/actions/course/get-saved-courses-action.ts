"use server";

import { getSavedCourses } from "@/app/data/course/get-saved-courses";
import { ApiResponse } from "@/lib/types";

export async function getSavedCoursesAction(cursor?: string, limit = 10): Promise<ApiResponse<{ courses: any[]; nextCursor: string | undefined }>> {
    try {
        const data = await getSavedCourses(cursor, limit);
        return { status: "success", message: "Saved courses fetched successfully", data };
    } catch (error) {
        console.error("Error in getSavedCoursesAction:", error);
        return { status: "error", message: "Failed to fetch saved courses" };
    }
}

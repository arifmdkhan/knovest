"use server";

import { getSavedCourses } from "@/app/data/course/get-saved-courses";

export async function getSavedCoursesAction(cursor?: string, limit = 10) {
    try {
        const data = await getSavedCourses(cursor, limit);
        return data;
    } catch (error) {
        console.error("Error in getSavedCoursesAction:", error);
        return { courses: [], nextCursor: undefined };
    }
}

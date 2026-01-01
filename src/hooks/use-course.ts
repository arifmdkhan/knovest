
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleSaveCourse } from "@/features/courses/actions/toggle-save-course";
import { ToggleSaveCourseSchemaType } from "@/features/courses/schemas";

export const useToggleSaveCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: ToggleSaveCourseSchemaType) => {
            const res = await toggleSaveCourse(data);
            if (res.status === "error") throw new Error(res.message);
            return { ...res.data, courseId: data.courseId };
        },
        onSuccess: (data) => {
            toast.success(data.saved ? "Course saved" : "Removed from saved courses");

            // Invalidate course queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["courses"] });

            // If we are on the saved courses page (if it exists or will exist)
            queryClient.invalidateQueries({ queryKey: ["saved-courses"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to save course");
        }
    });
};

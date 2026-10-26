"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useToggleSaveCourse } from "@/hooks/use-course";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveCourseButtonProps {
    courseId: string;
    initialIsSaved: boolean;
}

export function SaveCourseButton({ courseId, initialIsSaved }: SaveCourseButtonProps) {
    const { data: session } = authClient.useSession();
    const { mutate: toggleSave, isPending: isSaving } = useToggleSaveCourse();
    const [isSaved, setIsSaved] = useState(initialIsSaved);

    const handleSave = () => {
        if (!session) {
            toast.error("Please login to save courses");
            return;
        }

        const previousState = isSaved;
        setIsSaved(!isSaved);

        toggleSave({ courseId }, {
            onSuccess: (resData) => {
                setIsSaved(!!resData.saved);
            },
            onError: () => {
                setIsSaved(previousState);
            }
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            disabled={isSaving}
            aria-label={isSaved ? "Remove saved course" : "Save course"}
            aria-pressed={isSaved}
            className={cn(
                "rounded-full hover:bg-primary/10 hover:text-primary shrink-0 h-11 w-11 transition-colors",
                isSaved && "text-primary hover:text-primary/90"
            )}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
            }}
        >
            <Bookmark className={cn("size-4", isSaved && "fill-current")} />
        </Button>
    );
}

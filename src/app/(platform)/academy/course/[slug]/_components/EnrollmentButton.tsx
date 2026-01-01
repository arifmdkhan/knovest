'use client'
import { Button } from "@/components/ui/button";

import { useTransition } from "react";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";
import { enrollCourse } from "@/features/courses/actions/enroll-course";


export function EnrollmentButton({ courseId }: { courseId: string }) {
    const [pending, startTransition] = useTransition()

    function onSubmit() {
        startTransition(async () => {
            const result = await enrollCourse(courseId);

            if (result.status === "success" && result.data?.checkoutUrl) {
                toast.success(result.message);
                window.location.href = result.data.checkoutUrl;
            } else {
                toast.error(result.message);
            }
        })

    }
    return (
        <Button onClick={onSubmit} disabled={pending} className="w-full">

            {pending ? (
                <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading...
                </>
            ) : (
                'Enroll Now'
            )

            }

        </Button>
    )
}
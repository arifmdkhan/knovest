"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { ShareDialog } from "@/components/share-dialog";

interface CourseActionsProps {
    title: string;
    slug: string;
}

export function CourseActions({ title, slug }: CourseActionsProps) {
    const [isShareOpen, setIsShareOpen] = useState(false);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/academy/course/${slug}`
        : "";

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary gap-2"
                onClick={() => setIsShareOpen(true)}
            >
                <Share2 className="size-4" />
                Share
            </Button>

            <ShareDialog
                isOpen={isShareOpen}
                onOpenChange={setIsShareOpen}
                url={shareUrl}
                title={`Check out this course: ${title}`}
            />
        </>
    )
}

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/features/reviews/actions/create-review";
import { Loader2, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
    courseId: string;
    parentId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ReviewForm({ courseId, parentId, onSuccess, onCancel }: ReviewFormProps) {
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isPending, startTransition] = useTransition();
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!parentId && rating === 0) {
            toast.error("Please select a rating.");
            return;
        }

        if (!comment.trim()) {
            toast.error("Please enter a comment.");
            return;
        }

        const formData = new FormData();
        formData.append("courseId", courseId);
        formData.append("rating", rating.toString());
        formData.append("comment", comment);
        if (parentId) {
            formData.append("parentId", parentId);
        }

        startTransition(async () => {
            const result = await createReview(formData);
            if (result.status === "success") {
                void queryClient.invalidateQueries({ queryKey: ["course-detail"] });
                void queryClient.invalidateQueries({ queryKey: ["courses"] });
                toast.success(result.message);
                setRating(0);
                setComment("");
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!parentId && (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-colors"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={cn(
                                    "w-6 h-6",
                                    (hoverRating || rating) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                )}
                            />
                        </button>
                    ))}
                </div>
            )}

            <Textarea
                placeholder={parentId ? "Write a reply..." : "Write a review..."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px] max-h-[300px]"
            />

            <div className="flex items-center gap-2">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {parentId ? "Post Reply" : "Submit Review"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}

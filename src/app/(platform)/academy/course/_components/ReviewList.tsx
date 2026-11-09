"use client";

import { useQueryClient } from "@tanstack/react-query";

import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Button } from "@/components/ui/button";
import { deleteReview } from "@/features/reviews/actions/delete-review";

import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ReviewForm } from "./ReviewForm";
import { cn } from "@/lib/utils";
import { Review, User } from "@/generated/prisma/client";

interface ReviewWithUser extends Review {
    user: Pick<User, "id" | "name" | "username" | "image" | "expertVerificationType" | "accountVerificationType">;
    replies?: (Review & { user: Pick<User, "id" | "name" | "username" | "image" | "expertVerificationType" | "accountVerificationType"> })[];
}

interface ReviewListProps {
    reviews: ReviewWithUser[];
    currentUserId?: string;
    courseId: string;
    courseOwnerId: string;
}

export function ReviewList({ reviews, currentUserId, courseId, courseOwnerId }: ReviewListProps) {
    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    currentUserId={currentUserId}
                    courseId={courseId}
                    courseOwnerId={courseOwnerId}
                />
            ))}
        </div>
    );
}

function ReviewItem({
    review,
    currentUserId,
    courseId,
    courseOwnerId,
}: {
    review: ReviewWithUser;
    currentUserId?: string;
    courseId: string;
    courseOwnerId: string;
}) {
    const queryClient = useQueryClient();
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        startTransition(async () => {
            const result = await deleteReview(review.id, courseId);
            if (result.status === "success") {
                void queryClient.invalidateQueries({ queryKey: ["course-detail"] });
                void queryClient.invalidateQueries({ queryKey: ["courses"] });
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <div className="border rounded-lg p-4 space-y-4 bg-card/50">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <UserAvatarWithInfo
                        name={review.user.name}
                        username={review.user.username}
                        image={review.user.image}
                        expertVerificationType={review.user.expertVerificationType}
                        accountVerificationType={review.user.accountVerificationType}
                    />
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                </div>
                {currentUserId === review.userId && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                "w-4 h-4",
                                review.rating >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/20"
                            )}
                        />
                    ))}
                </div>
                <p className="text-sm">{review.comment}</p>
            </div>

            {currentUserId === courseOwnerId && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Reply
                    </Button>
                </div>
            )}

            {isReplying && (
                <div className="pl-4 border-l-2 border-muted">
                    <ReviewForm
                        courseId={courseId}
                        parentId={review.id}
                        onSuccess={() => setIsReplying(false)}
                        onCancel={() => setIsReplying(false)}
                    />
                </div>
            )}

            {review.replies && review.replies.length > 0 && (
                <div className="pl-6 space-y-4 mt-4 border-l-2 border-muted/50">
                    {review.replies.map((reply) => (
                        <div key={reply.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <UserAvatarWithInfo
                                    name={reply.user.name}
                                    username={reply.user.username}
                                    image={reply.user.image}
                                    expertVerificationType={reply.user.expertVerificationType}
                                    accountVerificationType={reply.user.accountVerificationType}
                                    avatarClassName="w-6 h-6"
                                />
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-sm pl-9">{reply.comment}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

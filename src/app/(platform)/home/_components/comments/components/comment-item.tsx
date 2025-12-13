"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateCommentForm } from "./create-comment-form";
import { CommentList } from "./comment-list";


export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  _count: { replies: number };
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="flex gap-3 py-3 group">
      <Link href={`/profile/${comment.user.username}`}>
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.image || ""} />
          <AvatarFallback>{comment.user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1 space-y-1">
        <div className="bg-muted/30 p-3 rounded-xl rounded-tl-none">
            <div className="flex justify-between items-start">
                <Link href={`/profile/${comment.user.username}`} className="font-semibold text-sm hover:underline">
                    {comment.user.name}
                </Link>
                <span className="text-xs text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-1">{comment.content}</p>
        </div>

        <div className="flex items-center gap-4 px-1">
            <button 
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
                Reply
            </button>
            
            {comment._count.replies > 0 && (
                <button 
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                    {showReplies ? "Hide replies" : `View ${comment._count.replies} replies`}
                </button>
            )}
        </div>

        {/* Reply Form */}
        {isReplying && (
            <div className="mt-2 pl-2 border-l-2 border-border ml-2">
                <CreateCommentForm 
                    postId={postId} 
                    parentId={comment.id} 
                    onSuccess={() => {
                        setIsReplying(false);
                        setShowReplies(true); // Auto expand to show new reply
                    }}
                    autoFocus
                />
            </div>
        )}

        {/* Nested Replies */}
        {showReplies && (
            <div className="mt-2 pl-4 border-l-2 border-border ml-2">
                <CommentList postId={postId} parentId={comment.id} />
            </div>
        )}
      </div>
    </div>
  );
}
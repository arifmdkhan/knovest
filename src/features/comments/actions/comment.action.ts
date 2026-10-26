"use server";

import { requireVisiblePost } from "@/features/posts/access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";
import { createNotification } from "@/features/notifications/services/create-notification";

const createCommentSchema = z.object({
  postId: z.string(),
  content: z.string().trim().min(1, "Comment cannot be empty").max(5000),
  parentId: z.string().optional(), // For nested replies
});

export async function createComment(data: z.infer<typeof createCommentSchema>): Promise<ApiResponse<any>> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { status: "error", message: "Unauthorized" };
        await enforceRateLimit(`mutations:${session.user.id}`, 60);

    const parsed = createCommentSchema.safeParse(data);
    if (!parsed.success) return { status: "error", message: "Invalid data" };

    const { postId, content, parentId } = parsed.data;
    await requireVisiblePost(postId, session.user.id);
    if (parentId && !await prisma.comment.findFirst({ where: { id: parentId, postId }, select: { id: true } })) return { status: "error", message: "Reply target unavailable" };

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        parentId,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      }
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (post?.authorId) {
      await createNotification({
        recipientId: post.authorId,
        actorId: session.user.id,
        type: "COMMENT",
        entityId: postId,
        message: "commented on your post"
      });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true }
      });
      if (parentComment?.userId && parentComment.userId !== session.user.id) {
        await createNotification({
          recipientId: parentComment.userId,
          actorId: session.user.id,
          type: "REPLY",
          entityId: postId,
          message: "replied to your comment"
        });
      }
    }

    revalidatePath("/home");

    return {
      status: "success",
      message: "Comment added",
      data: newComment
    };

  } catch (error) {
    console.error("Create Comment Error:", error);
    return { status: "error", message: "Failed to add comment" };
  }
}

export async function getComments(postId: string, parentId?: string, cursor?: string, limit = 5): Promise<ApiResponse<{ comments: any[]; nextCursor: string | undefined }>> {
  try {
    const session = await getServerSession();
    await requireVisiblePost(postId, session?.user.id);
    limit = Math.min(50, Math.max(1, Math.trunc(limit) || 5));
    const comments = await prisma.comment.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        postId,
        parentId: parentId || null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        _count: { select: { replies: true } }
      }
    });

    let nextCursor: string | undefined = undefined;
    if (comments.length > limit) {
      const nextItem = comments.pop();
      nextCursor = nextItem?.id;
    }

    return {
      status: "success",
      message: "Comments fetched successfully",
      data: { comments, nextCursor }
    };
  } catch (error) {
    console.error("Get Comments Error:", error);
    return { status: "error", message: "Failed to fetch comments" };
  }
}

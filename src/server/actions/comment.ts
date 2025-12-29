"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { z } from "zod";

import { revalidatePath } from "next/cache";
import { ApiResponse } from "@/types/api";
import { createNotification } from "@/server/actions/notifications";

const createCommentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, "Comment cannot be empty"),
  parentId: z.string().optional(), // For nested replies
});

export async function createComment(data: z.infer<typeof createCommentSchema>): Promise<ApiResponse<any>> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { status: "error", message: "Unauthorized" };

    const parsed = createCommentSchema.safeParse(data);
    if (!parsed.success) return { status: "error", message: "Invalid data" };

    const { postId, content, parentId } = parsed.data;

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

    revalidatePath("/feed"); // Or more specific path if applicable

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
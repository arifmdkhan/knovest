import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export function postVisibilityWhere(viewerId?: string): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    author: { deletedAt: null },
    OR: [
      { visibility: "PUBLIC" },
      ...(viewerId ? [
        { authorId: viewerId },
        { visibility: "FOLLOWERS" as const, author: { followedBy: { some: { followerId: viewerId } } } },
        { visibility: "SUBSCRIBER" as const, author: { subscribers: { some: { subscriberId: viewerId, status: "ACTIVE" as const } } } },
      ] : []),
    ],
  };
}

export function readablePostWhere(viewerId?: string): Prisma.PostWhereInput {
  return { AND: [postVisibilityWhere(viewerId), {
    OR: [{ originalPostId: null }, { Post: { is: postVisibilityWhere(viewerId) } }],
  }] };
}

export async function requireVisiblePost(postId: string, viewerId?: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, ...readablePostWhere(viewerId) },
    select: { id: true, authorId: true, visibility: true, originalPostId: true },
  });
  if (!post) throw new Error("Post unavailable");
  return post;
}

export function postMediaUrl(postId: string, mediaId: string) {
  return `/api/posts/${encodeURIComponent(postId)}/media/${encodeURIComponent(mediaId)}`;
}

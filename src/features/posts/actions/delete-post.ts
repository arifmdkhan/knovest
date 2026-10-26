"use server";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { deletePostSchema, type DeletePostSchemaType } from "@/features/posts/schemas";
import { enqueueCleanup } from "@/lib/storage/cleanup-jobs";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types/api";
export async function deletePost(data: DeletePostSchemaType): Promise<ApiResponse> {
  const session = await getServerSession();
  const parsed = deletePostSchema.safeParse(data);
  if (!session || !parsed.success) return { status: "error", message: "Unauthorized or invalid request" };
  const postId = parsed.data.postId;
  try {
    await prisma.$transaction(async tx => {
      await tx.post.update({ where: { id: postId, authorId: session.user.id, deletedAt: null }, data: { deletedAt: new Date() } });
      await enqueueCleanup(tx, "POST", postId, ["posts/" + postId + "/", "users/" + session.user.id + "/posts/" + postId + "/"]);
    });
    revalidatePath("/home"); revalidatePath("/bookmark");
    return { status: "success", message: "Post deleted; media cleanup queued" };
  } catch { return { status: "error", message: "Could not delete post" }; }
}

"use server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/features/user/queries/require-user";
import { enqueueCleanup } from "@/lib/storage/cleanup-jobs";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types/api";
export async function DeleteArticle(articleId: string): Promise<ApiResponse> {
  const user = await requireUser();
  try {
    await prisma.$transaction(async tx => {
      const article = await tx.article.findUnique({ where: { id: articleId, authorId: user.id }, select: { status: true } });
      if (!article) throw new Error("Not found");
      await enqueueCleanup(tx, "ARTICLE", articleId, ["articles/" + articleId + "/"]);
      if (article.status === "ARCHIVED") await tx.article.delete({ where: { id: articleId } });
      else await tx.article.update({ where: { id: articleId }, data: { status: "ARCHIVED", deletedAt: new Date() } });
    });
    revalidatePath("/academy"); revalidatePath("/academy/creator");
    return { status: "success", message: "Article deleted; media cleanup queued" };
  } catch { return { status: "error", message: "Could not delete article" }; }
}

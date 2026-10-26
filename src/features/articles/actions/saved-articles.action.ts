"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/features/user/queries/require-user";
import { safeAction } from "@/lib/safe-action";

export async function getSavedArticleIds() {
  const user = await requireUser();
  const rows = await prisma.savedArticle.findMany({ where: { userId: user.id }, select: { articleId: true } });
  return rows.map(row => row.articleId);
}

export async function getSavedArticles(cursor?: string) {
  const user = await requireUser();
  const rows = await prisma.savedArticle.findMany({
    where: { userId: user.id, article: { status: "PUBLISHED", deletedAt: null } },
    include: { article: { include: { author: { select: { name: true, username: true, image: true, expertVerificationType: true, accountVerificationType: true } } } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 13,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return { articles: rows.slice(0, 12).map(row => row.article), nextCursor: rows.length > 12 ? rows[11].id : undefined };
}

export const setArticleSaved = safeAction(z.object({ articleId: z.string().uuid(), saved: z.boolean() }), async ({ articleId, saved }, { user }) => {
  if (saved) {
    const article = await prisma.article.findFirst({ where: { id: articleId, status: "PUBLISHED", deletedAt: null }, select: { id: true } });
    if (!article) return { status: "error", message: "Article is unavailable" };
    await prisma.savedArticle.upsert({ where: { userId_articleId: { userId: user!.id, articleId } }, create: { userId: user!.id, articleId }, update: {} });
  } else {
    await prisma.savedArticle.deleteMany({ where: { userId: user!.id, articleId } });
  }
  return { status: "success", message: saved ? "Article saved" : "Article removed", data: { saved } };
}, { requiredRole: "USER" });

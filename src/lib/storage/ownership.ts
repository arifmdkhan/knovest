import "server-only";
import { prisma } from "@/lib/db";

export async function canDeleteStorageKey(key: string, userId: string): Promise<boolean> {
  const parts = key.split("/");
  if (parts.some(part => !part || part === "." || part === "..")) return false;
  if (parts[0] === "users") return parts[1] === userId;
  if (parts[0] === "documents" && parts[1] === "users") return parts[2] === userId;
  if (parts[0] === "courses") {
    return !!await prisma.course.findFirst({ where: { id: parts[1], userId }, select: { id: true } });
  }
  if (parts[0] === "articles") {
    return !!await prisma.article.findFirst({ where: { id: parts[1], authorId: userId }, select: { id: true } });
  }
  if (parts[0] === "posts") {
    return !!await prisma.post.findFirst({ where: { id: parts[1], authorId: userId }, select: { id: true } });
  }
  // Unclaimed draft files require scheduled cleanup, not arbitrary user deletion.
  return false;
}

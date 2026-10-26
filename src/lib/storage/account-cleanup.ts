import "server-only";
import { prisma } from "@/lib/db";

// Preserve ownership before the auth adapter cascades rows. The worker refuses
// to process this job until the account deletion has committed.
export async function queueAccountCleanup(userId: string) {
  const [courses, articles, posts] = await Promise.all([
    prisma.course.findMany({ where: { userId }, select: { id: true } }),
    prisma.article.findMany({ where: { authorId: userId }, select: { id: true } }),
    prisma.post.findMany({ where: { authorId: userId }, select: { id: true } }),
  ]);
  if ([userId, ...courses.map(item => item.id), ...articles.map(item => item.id), ...posts.map(item => item.id)].some(id => !/^[a-zA-Z0-9_-]+$/.test(id))) throw new Error("Legacy storage identifiers require manual cleanup");
  await prisma.cleanupJob.create({ data: {
    entityType: "USER", entityId: userId, scheduledAt: new Date(Date.now() + 5 * 60000),
    prefixes: [`users/${userId}/`, `documents/users/${userId}/`, `uploads/tmp/${userId}/`, ...courses.map(item => `courses/${item.id}/`), ...articles.map(item => `articles/${item.id}/`), ...posts.map(item => `posts/${item.id}/`)],
  } });
}

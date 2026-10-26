import "server-only";
import { randomUUID } from "node:crypto";
import { ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3-client";
import { isCanonicalKey } from "./asset-keys";
import type { CleanupJob } from "@/generated/prisma/client";

export async function deleteStoragePrefix(bucket: string, prefix: string) {
  if (!prefix.endsWith("/") || !isCanonicalKey(prefix.slice(0, -1))) throw new Error("Invalid cleanup prefix");
  let token: string | undefined;
  for (let page = 0; page < 20; page++) {
    const result = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    const objects = result.Contents?.filter(object => object.Key).map(object => ({ Key: object.Key! })) || [];
    if (objects.length) {
      const deleted = await s3Client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }));
      if (deleted.Errors?.length) throw new Error("Storage deletion incomplete");
    }
    token = result.NextContinuationToken;
    if (!token) return;
  }
  throw new Error("Cleanup page budget reached; retry remaining objects");
}

export async function processCleanupJob(job: CleanupJob) {
  const now = new Date();
  const leaseToken = randomUUID();
  const claimed = await prisma.cleanupJob.updateMany({
    where: { id: job.id, attempts: { lt: 5 }, OR: [{ status: { in: ["PENDING", "FAILED"] }, scheduledAt: { lte: now } }, { status: "PROCESSING", leaseExpiresAt: { lt: now } }] },
    data: { status: "PROCESSING", leaseToken, leaseExpiresAt: new Date(now.getTime() + 10 * 60000), attempts: { increment: 1 } },
  });
  if (!claimed.count) return { id: job.id, status: "SKIPPED" };
  try {
    if (job.entityType === "OBJECT") {
      if (!isCanonicalKey(job.entityId) || !job.entityId.startsWith("courses/") || !job.entityId.includes("/video/raw/")) throw new Error("Invalid object cleanup");
      if (!process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES) throw new Error("Storage is not configured");
      await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES, Key: job.entityId }));
      await prisma.cleanupJob.updateMany({ where: { id: job.id, leaseToken }, data: { status: "COMPLETED", leaseToken: null, leaseExpiresAt: null } });
      return { id: job.id, status: "COMPLETED" };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(job.entityId)) throw new Error("Invalid cleanup entity identifier");
    if (job.entityType === "USER" && await prisma.user.findUnique({ where: { id: job.entityId }, select: { id: true } })) throw new Error("Account deletion has not committed");
    const defaults: Record<string, string[]> = { POST: [`posts/${job.entityId}/`], ARTICLE: [`articles/${job.entityId}/`], COURSE: [`courses/${job.entityId}/`], USER: [`users/${job.entityId}/`, `documents/users/${job.entityId}/`] };
    const prefixes = job.prefixes.length ? job.prefixes : defaults[job.entityType];
    if (!prefixes?.length) throw new Error("Unknown cleanup type");
    const buckets = [process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES, process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES];
    if (buckets.some(bucket => !bucket)) throw new Error("Storage is not configured");
    for (const bucket of buckets) for (const prefix of prefixes) await deleteStoragePrefix(bucket!, prefix);
    await prisma.cleanupJob.updateMany({ where: { id: job.id, leaseToken }, data: { status: "COMPLETED", leaseToken: null, leaseExpiresAt: null } });
    return { id: job.id, status: "COMPLETED" };
  } catch {
    await prisma.cleanupJob.updateMany({ where: { id: job.id, leaseToken }, data: { status: "FAILED", leaseToken: null, leaseExpiresAt: null, scheduledAt: new Date(Date.now() + Math.min(60, 2 ** job.attempts) * 60000) } });
    return { id: job.id, status: "FAILED" };
  }
}

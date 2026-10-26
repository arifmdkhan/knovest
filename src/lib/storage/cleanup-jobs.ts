import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export function enqueueCleanup(tx: Prisma.TransactionClient, entityType: string, entityId: string, prefixes: string[]) {
  if (!/^[a-zA-Z0-9_-]+$/.test(entityId)) throw new Error("Invalid cleanup entity identifier");
  return tx.cleanupJob.create({ data: { entityType, entityId, prefixes, scheduledAt: new Date() } });
}

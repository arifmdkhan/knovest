import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "./db";

export class RateLimitError extends Error {
  constructor(message = "Too many requests. Please try again shortly.") { super(message); }
}

// One atomic shared counter. A database failure denies work rather than
// silently reverting to independent per-process limits.
export async function enforceRateLimit(key: string, max = 120, windowSeconds = 60, cost = 1) {
  if (!Number.isSafeInteger(cost) || cost < 1 || cost > max) throw new RateLimitError();
  const now = BigInt(Date.now());
  const cutoff = now - BigInt(windowSeconds * 1000);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, ${cost}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rate_limit"."lastRequest" <= ${cutoff} THEN ${cost} ELSE "rate_limit"."count" + ${cost} END,
      "lastRequest" = CASE WHEN "rate_limit"."lastRequest" <= ${cutoff} THEN ${now} ELSE "rate_limit"."lastRequest" END
    WHERE "rate_limit"."lastRequest" <= ${cutoff} OR "rate_limit"."count" <= ${max - cost}
    RETURNING "count"
  `;
  if (!rows.length) throw new RateLimitError();
}

export async function enforceUploadQuota(userId: string, maximumBytes: number) {
  const cost = Math.ceil(maximumBytes / 1024 / 1024);
  const dailyTotal = Number(process.env.UPLOAD_DAILY_MIB_LIMIT || 10240);
  if (!Number.isSafeInteger(dailyTotal) || dailyTotal < 0) throw new Error("Invalid daily upload budget");
  try {
    await enforceRateLimit(`upload-mib:${userId}`, 1024, 86400, cost);
    await enforceRateLimit("upload-total-mib", dailyTotal, 86400, cost);
  } catch (error) {
    if (error instanceof RateLimitError) throw new RateLimitError("The daily upload budget has been reached. Try again after 24 hours.");
    throw error;
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanupTemporaryUploads, cleanupAbandonedMultipartUploads } from "@/lib/storage/temporary-cleanup";
import { processCleanupJob } from "@/lib/storage/run-cleanup";
export const maxDuration = 300;
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const temporaryUploadsDeleted = await cleanupTemporaryUploads();
    const multipartUploadsAborted = await cleanupAbandonedMultipartUploads();
    const now = new Date();
    const jobs = await prisma.cleanupJob.findMany({
      where: { attempts: { lt: 5 }, OR: [{ status: { in: ["PENDING", "FAILED"] }, scheduledAt: { lte: now } }, { status: "PROCESSING", leaseExpiresAt: { lt: now } }] },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }], take: 10,
    });
    const results = [];
    for (const job of jobs) results.push(await processCleanupJob(job));
    await prisma.rateLimit.deleteMany({ where: { lastRequest: { lt: BigInt(Date.now() - 2 * 86400000) } } });
    return NextResponse.json({ temporaryUploadsDeleted, multipartUploadsAborted, results }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Cleanup unavailable" }, { status: 503 }); }
}

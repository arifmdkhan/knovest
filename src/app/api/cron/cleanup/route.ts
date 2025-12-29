
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3-client";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { CleanupJob } from "@/generated/prisma/client";

const BATCH_SIZE = 10;
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
const PRIVATE_BUCKET = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const jobs = await prisma.cleanupJob.findMany({
            where: {
                status: "PENDING",
                scheduledAt: { lte: new Date() }
            },
            take: BATCH_SIZE
        });

        if (jobs.length === 0) {
            return NextResponse.json({ message: "No jobs pending" });
        }

        const results = await Promise.allSettled(jobs.map(processJob));

        return NextResponse.json({
            processed: results.length,
            results: results.map(r => r.status === "fulfilled" ? r.value : r.reason)
        });

    } catch (error) {
        console.error("Cleanup Cron Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function processJob(job: CleanupJob) {
    const { id, entityType, entityId } = job;
    const prefixes: string[] = [];

    // Determine Prefix Plan
    switch (entityType) {
        case "POST":
            prefixes.push(`posts/${entityId}/`);
            break;
        case "ARTICLE":
            prefixes.push(`articles/${entityId}/`);
            break;
        case "COURSE":
            prefixes.push(`courses/${entityId}/`);
            break;
        case "USER":
            prefixes.push(`users/${entityId}/`);
            prefixes.push(`documents/users/${entityId}/`);
            break;
        default:
            console.warn(`Unknown entity type for cleanup: ${entityType}`);
            await prisma.cleanupJob.update({
                where: { id },
                data: { status: "FAILED" } // Mark failed so we don't retry loop
            });
            return { id, status: "FAILED", reason: "Unknown Type" };
    }

    if (prefixes.length === 0) return { id, status: "SKIPPED" };

    try {
        // Attempt clean from both buckets to be thorough
        for (const prefix of prefixes) {
            await deletePrefixFromBucket(PUBLIC_BUCKET, prefix);

            // Only verify/attempt private if it makes sense, but safe to try
            if (PRIVATE_BUCKET) {
                await deletePrefixFromBucket(PRIVATE_BUCKET, prefix);
            }
        }

        await prisma.cleanupJob.update({
            where: { id },
            data: { status: "COMPLETED" }
        });

        return { id, status: "COMPLETED" };

    } catch (error) {
        console.error(`Job ${id} Failed:`, error);
        await prisma.cleanupJob.update({
            where: { id },
            data: {
                status: "FAILED",
                attempts: { increment: 1 }
            }
        });
        return { id, status: "FAILED", error };
    }
}

async function deletePrefixFromBucket(bucket: string | undefined, prefix: string) {
    if (!bucket) return;

    let continuationToken: string | undefined;

    do {
        const listCmd = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken
        });

        const listRes = await s3Client.send(listCmd);

        if (listRes.Contents && listRes.Contents.length > 0) {
            const objectsToDelete = listRes.Contents.map(obj => ({ Key: obj.Key }));

            const deleteCmd = new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: objectsToDelete }
            });

            await s3Client.send(deleteCmd);
            console.log(`Deleted ${objectsToDelete.length} objects from ${bucket}/${prefix}`);
        }

        continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);
}

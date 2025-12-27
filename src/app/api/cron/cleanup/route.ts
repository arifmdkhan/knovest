
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { s3Client } from "@/lib/s3-client";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const BATCH_SIZE = 10;
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
const PRIVATE_BUCKET = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;

export async function GET(req: Request) {
    // Basic security check (e.g. CRON_SECRET) logic can be added here
    // For now, assuming Vercel Cron or simple authorized ping

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

async function processJob(job: any) {
    const { id, entityType, entityId } = job;
    let prefix = "";

    // Determine Prefix Plan
    switch (entityType) {
        case "POST":
            prefix = `posts/${entityId}/`;
            break;
        case "ARTICLE":
            prefix = `articles/${entityId}/`;
            break;
        case "COURSE":
            prefix = `courses/${entityId}/`;
            break;
        case "USER": // Logic for User deletion if implemented?
            prefix = `users/${entityId}/`; // and documents/users/{userId}/ ?
            // For now, handling the known types. 
            break;
        default:
            console.warn(`Unknown entity type for cleanup: ${entityType}`);
            await prisma.cleanupJob.update({
                where: { id },
                data: { status: "FAILED" } // Mark failed so we don't retry loop
            });
            return { id, status: "FAILED", reason: "Unknown Type" };
    }

    if (!prefix) return { id, status: "SKIPPED" };

    try {
        // Attempt clean from both buckets to be thorough
        await deletePrefixFromBucket(PUBLIC_BUCKET, prefix);

        // Only verify/attempt private if it makes sense, but safe to try
        if (PRIVATE_BUCKET) {
            await deletePrefixFromBucket(PRIVATE_BUCKET, prefix);
        }

        // Special case for User documents? "documents/users/{userId}/"
        // If entityType is USER, we might need multiple prefixes.
        // For now, implemented types (Article, Course, Post) use single root prefix.

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

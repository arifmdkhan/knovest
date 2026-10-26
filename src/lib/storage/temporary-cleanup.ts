import "server-only";
import { DeleteObjectsCommand, ListObjectsV2Command, ListMultipartUploadsCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";

export async function cleanupTemporaryUploads(now = new Date()): Promise<number> {
  const bucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;
  if (!bucket) return 0;
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  let token: string | undefined;
  let deleted = 0;
  // Bound each cron run; subsequent runs scan remaining objects again.
  for (let page = 0; page < 5; page++) {
    const result = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: "uploads/tmp/", ContinuationToken: token,
    }));
    const objects = (result.Contents || [])
      .filter(object => object.Key && object.LastModified && object.LastModified.getTime() < cutoff)
      .map(object => ({ Key: object.Key! }));
    if (objects.length) {
      const removed = await s3Client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }));
      if (removed.Errors?.length) throw new Error("Temporary upload cleanup failed");
      deleted += objects.length;
    }
    token = result.NextContinuationToken;
    if (!token) break;
  }
  return deleted;
}

export async function cleanupAbandonedMultipartUploads(now = new Date()) {
  const bucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;
  if (!bucket) return 0;
  const uploads = await s3Client.send(new ListMultipartUploadsCommand({ Bucket: bucket, Prefix: "courses/", MaxUploads: 100 }));
  let aborted = 0;
  for (const upload of uploads.Uploads || []) {
    if (upload.UploadId && upload.Key && /^courses\/[^/]+\/lessons\/[^/]+\/video\/raw\/[^/]+$/.test(upload.Key) && upload.Initiated && upload.Initiated.getTime() < now.getTime() - 86400000) {
      await s3Client.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: upload.Key, UploadId: upload.UploadId }));
      aborted++;
    }
  }
  return aborted;
}

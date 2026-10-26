import { PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3-client";
import { BucketType, UPLOAD_CONFIGS, UploadIntent } from "./types";
import { KeyFactory } from "./key-factory";
import { constructUrl } from "@/lib/construct-url";
import { matchesFileSignature } from "./file-signature";

// Validate Env Vars
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
const PRIVATE_BUCKET = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;

export class StorageService {
    private static getBucketName(type: BucketType): string {
        const bucket = type === BucketType.PUBLIC ? PUBLIC_BUCKET : PRIVATE_BUCKET;
        if (!bucket) throw new Error("Missing S3 bucket environment variable");
        return bucket;
    }

    /**
     * Generates a presigned URL for uploading a file to a temporary location.
     */
    static async getPresignedUploadUrl(
        intent: UploadIntent,
        params: Record<string, string>,
        contentType: string,
        size: number
    ) {
        const config = UPLOAD_CONFIGS[intent];

        // Validate Intent
        if (!config) throw new Error("Invalid Upload Intent");

        if (config.bucket === BucketType.PUBLIC && !constructUrl("storage-check")) {
            throw new Error("Public storage URL is not configured");
        }

        // Validate MIME Type
        if (!config.allowedMimeTypes.includes(contentType)) {
            throw new Error(`Invalid content type: ${contentType}. Allowed: ${config.allowedMimeTypes.join(", ")}`);
        }

        // Validate Size
        if (size > config.maxSize) {
            throw new Error(`File too large. Max allowed: ${config.maxSize / 1024 / 1024}MB`);
        }

        const ext = contentType.split("/")[1] || "bin";
        const tempKey = KeyFactory.getTemporaryKey(ext, params.userId);
        const bucket = this.getBucketName(BucketType.PRIVATE); 

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: tempKey,
            ContentType: contentType,
            ContentLength: size,
          
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

        return { url, tempKey };
    }

    /**
     * Moves a file from temporary storage to its final canonical destination.
     */
    static async confirmUpload(
        tempKey: string,
        intent: UploadIntent,
        params: Record<string, string>
    ): Promise<string> {
        const config = UPLOAD_CONFIGS[intent];
        if (!config) throw new Error("Invalid Upload Intent");
        if (!params.userId || !tempKey.startsWith(`uploads/tmp/${params.userId}/`) || tempKey.includes("..")) {
            throw new Error("This upload does not belong to you");
        }
        const ext = tempKey.split(".").pop() || "";
        const finalKey = KeyFactory.getPayload(intent, params, ext);
        const sourceBucket = this.getBucketName(BucketType.PRIVATE);
        const destBucket = this.getBucketName(config.bucket);

        try {
            const object = await s3Client.send(new HeadObjectCommand({ Bucket: sourceBucket, Key: tempKey }));
            if (!object.ContentLength || object.ContentLength > config.maxSize || !config.allowedMimeTypes.includes(object.ContentType || "")) {
                throw new Error("Uploaded file exceeds the allowed size or type");
            }
            await this.validateSignature(sourceBucket, tempKey, object.ContentType!);
        } catch {
            throw new Error("Temporary file not found or expired");
        }

        await s3Client.send(new CopyObjectCommand({
            CopySource: `${sourceBucket}/${tempKey}`,
            Bucket: destBucket,
            Key: finalKey,
        }));

        await s3Client.send(new DeleteObjectCommand({ Bucket: sourceBucket, Key: tempKey }));

        return finalKey;
    }

    /**
     * Initiates a multipart upload.
     */
    static async createMultipartUpload(
        intent: UploadIntent,
        params: Record<string, string>,
        contentType: string
    ): Promise<{ uploadId: string; key: string }> {
        const config = UPLOAD_CONFIGS[intent];
        if (!config) throw new Error("Invalid Upload Intent");

        if (!config.allowedMimeTypes.includes(contentType)) throw new Error("Unsupported upload type");
        const ext = contentType.split("/")[1] || "mp4";
        const key = KeyFactory.getPayload(intent, params, ext);
        const bucket = this.getBucketName(config.bucket);

        const command = new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });

        const { UploadId } = await s3Client.send(command);
        if (!UploadId) throw new Error("Failed to initiate multipart upload");

        return { uploadId: UploadId, key };
    }

    /**
     * Generates a presigned URL for a specific part of a multipart upload.
     */
    static async getPresignedPartUrl(
        intent: UploadIntent,
        key: string,
        uploadId: string,
        partNumber: number
    ): Promise<string> {
        const config = UPLOAD_CONFIGS[intent];
        if (!config) throw new Error("Invalid Upload Intent");

        const bucket = this.getBucketName(config.bucket);

        const command = new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });

        return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour per part
    }

    /**
     * Completes a multipart upload.
     */
    static async completeMultipartUpload(
        intent: UploadIntent,
        key: string,
        uploadId: string,
        parts: { ETag: string; PartNumber: number }[]
    ): Promise<void> {
        const config = UPLOAD_CONFIGS[intent];
        if (!config) throw new Error("Invalid Upload Intent");
        const bucket = this.getBucketName(config.bucket);

        const command = new CompleteMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts },
        });

        await s3Client.send(command);
        const object = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        if (!object.ContentLength || object.ContentLength > config.maxSize || !config.allowedMimeTypes.includes(object.ContentType || "")) {
            await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
            throw new Error("Uploaded file exceeds the allowed size or type");
        }
        try { await this.validateSignature(bucket, key, object.ContentType!); }
        catch (error) { await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); throw error; }
    }

    private static async validateSignature(bucket: string, key: string, type: string) {
        const object = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-31" }));
        const bytes = await object.Body?.transformToByteArray();
        if (!bytes || !matchesFileSignature(type, bytes)) throw new Error("File contents do not match the selected type");
    }

    static async abortMultipartUpload(key: string, uploadId: string) {
        await s3Client.send(new AbortMultipartUploadCommand({ Bucket: this.getBucketName(BucketType.PRIVATE), Key: key, UploadId: uploadId }));
    }

   
    //  Generates a presigned URL for GET (download/playback) of a private object.
     
    static async getPlaybackUrl(key: string): Promise<string> {
        return this.getPresignedDownloadUrl(key, 3600);
    }

    /**
     * Generates a presigned URL with custom expiration.
     */
    static async getPresignedDownloadUrl(key: string, expiresIn: number): Promise<string> {
        const bucket = this.getBucketName(BucketType.PRIVATE);
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        return getSignedUrl(s3Client, command, { expiresIn });
    }
}

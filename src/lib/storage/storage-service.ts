import { PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3-client";
import { BucketType, UPLOAD_CONFIGS, UploadIntent } from "./types";
import { KeyFactory } from "./key-factory";

// Validate Env Vars
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
const PRIVATE_BUCKET = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;

if (!PUBLIC_BUCKET || !PRIVATE_BUCKET) {
    throw new Error("Missing S3 Bucket Environment Variables");
}

export class StorageService {
    private static getBucketName(type: BucketType): string {
        return type === BucketType.PUBLIC ? PUBLIC_BUCKET! : PRIVATE_BUCKET!;
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

        // Validate MIME Type
        if (!config.allowedMimeTypes.includes(contentType)) {
            throw new Error(`Invalid content type: ${contentType}. Allowed: ${config.allowedMimeTypes.join(", ")}`);
        }

        // Validate Size
        if (size > config.maxSize) {
            throw new Error(`File too large. Max allowed: ${config.maxSize / 1024 / 1024}MB`);
        }

        const ext = contentType.split("/")[1] || "bin";
        const tempKey = KeyFactory.getTemporaryKey(ext); // uploads/tmp/{uuid}.ext
        const bucket = this.getBucketName(BucketType.PRIVATE); // TMP is always PRIVATE per spec: "Temporary uploads (private, mandatory)"

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: tempKey,
            ContentType: contentType,
            // ContentLength: size, // Removed to prevent signature mismatch issues with Tigris/Proxies
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
        // ... (existing code)
        const config = UPLOAD_CONFIGS[intent];
        if (!config) throw new Error("Invalid Upload Intent");
        const ext = tempKey.split(".").pop() || "";
        const finalKey = KeyFactory.getPayload(intent, params, ext);
        const sourceBucket = this.getBucketName(BucketType.PRIVATE);
        const destBucket = this.getBucketName(config.bucket);

        try {
            await s3Client.send(new HeadObjectCommand({ Bucket: sourceBucket, Key: tempKey }));
        } catch (e) {
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
     * Generates a presigned URL for GET (download/playback) of a private object.
     */
    static async getPlaybackUrl(key: string): Promise<string> {
        const bucket = this.getBucketName(BucketType.PRIVATE);
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        // 1 Hour expiry
        return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }
}

"use server";

import { getServerSession } from "@/lib/get-sessions";
import { s3Client } from "@/lib/s3-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ApiResponse } from "@/types/api";
import { canDeleteStorageKey } from "@/lib/storage/ownership";

export async function deleteMediaAction(key: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return { status: "error", message: "Unauthorized" };
        }

        if (session.user.banned || !await canDeleteStorageKey(key, session.user.id)) {
            return { status: "error", message: "Media not found or access denied" };
        }

        const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
        let targetBucket = bucket;

        if (key.startsWith("documents/") || /^users\/[^/]+\/posts\//.test(key) || (key.startsWith("courses/") && (key.includes("/video/") || key.includes("/resources/")))) {
            targetBucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;
        }

        if (key.startsWith("uploads/tmp/")) {
            targetBucket = process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES;
        }

        await s3Client.send(new DeleteObjectCommand({
            Bucket: targetBucket,
            Key: key,
        }));

        return { status: "success", message: "Media deleted" };
    } catch (error: unknown) {
        console.error("Delete Error:", error);
        return { status: "error", message: "Failed to delete" };
    }
}

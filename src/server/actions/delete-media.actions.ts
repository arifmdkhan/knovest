"use server";

import { getServerSession } from "@/lib/get-sessions";
import { s3Client } from "@/lib/s3-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ApiResponse } from "@/lib/types";

export async function deleteMediaAction(key: string): Promise<ApiResponse> {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return { status: "error", message: "Unauthorized" };
        }

        const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
        let targetBucket = bucket;

        if (key.startsWith("documents/") || (key.startsWith("courses/") && key.includes("/video/"))) {
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
    } catch (error: any) {
        console.error("Delete Error:", error);
        return { status: "error", message: "Failed to delete" };
    }
}

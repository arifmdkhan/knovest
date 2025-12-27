"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadIntent } from "@/lib/storage/types";
import { getPresignedUploadUrlAction, confirmUploadAction } from "@/server/actions/upload.actions";

interface UseMediaUploadOptions {
    intent: UploadIntent;
    onUploadComplete?: (key: string) => void;
    onUploadError?: (error: Error) => void;
}

export function useMediaUpload({ intent, onUploadComplete, onUploadError }: UseMediaUploadOptions) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0); // Simple progress state


    // --- Upload Logic with XHR for Progress ---
    const uploadFile = async (file: File, params: Record<string, string> = {}) => {
        setIsUploading(true);
        setProgress(0);

        try {
            // 1. Get Presigned URL
            const presignRes = await getPresignedUploadUrlAction(intent, params, file.type, file.size);

            if (presignRes.status === "error" || !presignRes.data?.url || !presignRes.data?.tempKey) {
                throw new Error(presignRes.message || "Failed to initiate upload");
            }

            const { url, tempKey } = presignRes.data;
            // setProgress(10); // Start progress

            // 2. Upload to S3 (XHR)
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", url, true);
                xhr.setRequestHeader("Content-Type", file.type);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        // Map 0-100 upload progress to 10-90% overall progress
                        // (0-10% is presign, 90-100% is confirmation)
                        const mappedProgress = 10 + (percentComplete * 0.8);
                        setProgress(Math.round(mappedProgress));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Network error during upload"));
                xhr.send(file);
            });

            setProgress(90);

            // 3. Confirm Upload
            const confirmRes = await confirmUploadAction(tempKey, intent, params);

            if (confirmRes.status === "error" || !confirmRes.data?.key) {
                throw new Error(confirmRes.message || "Failed to confirm upload");
            }
            setProgress(100);

            if (onUploadComplete) {
                onUploadComplete(confirmRes.data.key);
            }

            return confirmRes.data.key;

        } catch (error: any) {
            console.error("Upload Error:", error);
            toast.error(error.message || "Upload failed");
            if (onUploadError) {
                onUploadError(error);
            }
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadFile,
        isUploading,
        progress,
    };
}

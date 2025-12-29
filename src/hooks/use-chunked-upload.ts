"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
    initiateMultipartUploadAction,
    getMultipartUploadUrlsAction,
    completeMultipartUploadAction
} from "@/server/actions/video-upload.actions";

interface UseChunkedUploadOptions {
    lessonId: string;
    onUploadComplete?: (key: string) => void;
    onUploadError?: (error: string) => void;
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks (min 5MB for S3)
const CONCURRENT_UPLOADS = 3;

export function useChunkedUpload({ lessonId, onUploadComplete, onUploadError }: UseChunkedUploadOptions) {
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Refs to manage cancellation if needed (not fully implemented yet but good practice)
    const abortControllers = useRef<AbortController[]>([]);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setProgress(0);

        try {
            // 1. Initiate
            const initRes = await initiateMultipartUploadAction(
                lessonId,
                file.name,
                file.type,
                file.size
            );

            if (initRes.status === "error" || !initRes.data) {
                throw new Error(initRes.message);
            }

            const { uploadId, key } = initRes.data;
            const totalParts = Math.ceil(file.size / CHUNK_SIZE);
            const uploadedParts: { ETag: string; PartNumber: number }[] = [];

            // 2. Chunk & Upload
            // We'll use a pool of workers pattern
            let activeUploads = 0;
            let nextPartNumber = 1;

            const uploadPart = async (partNumber: number): Promise<{ ETag: string; PartNumber: number }> => {
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                // Get URL
                const urlRes = await getMultipartUploadUrlsAction(lessonId, uploadId, key, [partNumber]);
                if (urlRes.status === "error" || !urlRes.data?.parts[0]) throw new Error("Failed to get part URL");

                const url = urlRes.data.parts[0].url;

                // Upload
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", url, true);

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const etag = xhr.getResponseHeader("ETag");
                            if (!etag) return reject(new Error("No ETag received"));
                            // Update global progress roughly
                            // (This is simplistic; for precise progress we'd need to track bytes per part)
                            // setProgress(prev => Math.min(99, prev + (100 / totalParts)));
                            resolve({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber });
                        } else {
                            reject(new Error(`Upload failed ${xhr.status}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error("Network error"));
                    xhr.send(chunk);
                });
            };

            // Simple batch processing
            // Todo: True concurrency pool
            // For MVP, simply batching

            for (let i = 1; i <= totalParts; i += CONCURRENT_UPLOADS) {
                const batch = [];
                for (let j = 0; j < CONCURRENT_UPLOADS && (i + j) <= totalParts; j++) {
                    batch.push(i + j);
                }

                const results = await Promise.all(batch.map(p => uploadPart(p)));
                uploadedParts.push(...results);

                // Update Progress
                const percent = Math.round((uploadedParts.length / totalParts) * 100);
                setProgress(percent);
            }

            // Sort parts (S3 requirement)
            uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);

            // 3. Complete
            const completeRes = await completeMultipartUploadAction(
                lessonId,
                uploadId,
                key,
                uploadedParts
            );

            if (completeRes.status === "error") throw new Error(completeRes.message);

            toast.success("Video uploaded successfully");
            if (onUploadComplete) onUploadComplete(key);

            return key;

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Upload failed");
            if (onUploadError) onUploadError(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, progress };
}

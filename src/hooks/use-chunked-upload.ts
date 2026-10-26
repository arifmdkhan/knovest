"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { initiateMultipartUploadAction, getMultipartUploadUrlsAction, completeMultipartUploadAction, abortMultipartUploadAction } from "@/features/media/actions/video-upload.action";

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

    const requests = useRef(new Set<XMLHttpRequest>());
    const cancelled = useRef(false);
    const busy = useRef(false);
    const active = useRef<{ uploadId: string; key: string } | null>(null);
    const cancelUpload = async () => {
        cancelled.current = true;
        for (const xhr of requests.current) xhr.abort();
        const upload = active.current;
        active.current = null;
        if (upload) await abortMultipartUploadAction({ lessonId, ...upload });
    };
    useEffect(() => () => {
        cancelled.current = true;
        for (const xhr of requests.current) xhr.abort();
        const upload = active.current;
        if (upload) void abortMultipartUploadAction({ lessonId, ...upload }).catch(() => {});
    }, [lessonId]);

    const uploadFile = async (file: File) => {
        if (busy.current) throw new Error("Wait for the current upload to finish");
        busy.current = true;
        cancelled.current = false;
        setIsUploading(true);
        setProgress(0);

        try {
            // 1. Initiate
            const initRes = await initiateMultipartUploadAction({
                lessonId,
                fileName: file.name,
                contentType: file.type,
                size: file.size
            });

            if (initRes.status === "error" || !initRes.data) {
                throw new Error(initRes.message);
            }

            const { uploadId, key } = initRes.data;
            active.current = { uploadId, key };
            if (cancelled.current) throw new Error("Upload cancelled");
            const totalParts = Math.ceil(file.size / CHUNK_SIZE);
            const uploadedParts: { ETag: string; PartNumber: number }[] = [];

            // 2. Chunk & Upload

            const uploadPart = async (partNumber: number): Promise<{ ETag: string; PartNumber: number }> => {
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                // Get URL
                const urlRes = await getMultipartUploadUrlsAction({ lessonId, uploadId, key, partNumbers: [partNumber] });
                if (urlRes.status === "error" || !urlRes.data?.parts[0]) throw new Error("Failed to get part URL");

                const url = urlRes.data.parts[0].url;
                if (cancelled.current) throw new Error("Upload cancelled");

                // Upload
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    requests.current.add(xhr);
                    xhr.open("PUT", url, true);

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const etag = xhr.getResponseHeader("ETag");
                            if (!etag) return reject(new Error("No ETag received"));
                    
                            resolve({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber });
                        } else {
                            reject(new Error(`Upload failed ${xhr.status}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error("Network error"));
                    xhr.onabort = () => reject(new Error("Upload cancelled"));
                    xhr.onloadend = () => requests.current.delete(xhr);
                    xhr.send(chunk);
                });
            };

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
            if (cancelled.current) throw new Error("Upload cancelled");

            // 3. Complete
            const completeRes = await completeMultipartUploadAction({
                lessonId,
                uploadId,
                key,
                parts: uploadedParts
            });

            if (completeRes.status === "error") throw new Error(completeRes.message);
            active.current = null;
            if (cancelled.current) return;

            toast.success("Video uploaded successfully");
            if (onUploadComplete) onUploadComplete(key);

            return key;

        } catch (error: any) {
            await cancelUpload().catch(() => {});
            console.error(error);
            toast.error(error.message || "Upload failed");
            if (onUploadError) onUploadError(error.message);
        } finally {
            busy.current = false;
            requests.current.clear();
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, progress, cancelUpload };
}

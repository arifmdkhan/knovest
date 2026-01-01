"use client";

import { useCallback, useState, useEffect } from "react";
import { FileRejection, useDropzone, Accept } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  X,
  UploadCloud,
  Loader2,
  FileText
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { compressImage } from "@/lib/image-compression";
import { constructUrl } from "@/lib/construct-url";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { UploadIntent } from "@/lib/storage/types";
import { useChunkedUpload } from "@/hooks/use-chunked-upload";

// --- Types ---
interface MediaFile {
  id: string;
  file: File | null;
  preview: string;
  progress: number;
  uploading: boolean;
  error: boolean;
  key?: string; // Add this definition if missing or implicit
  type: "IMAGE" | "VIDEO" | "PDF";
}

export interface UploadedMedia {
  url: string;
  name?: string;
  key?: string;
  type: "IMAGE" | "VIDEO" | "PDF";
}

export type MediaType = "image" | "video" | "pdf";

interface MediaUploaderProps {
  onChange: (files: UploadedMedia[]) => void;
  maxFiles?: number;
  allowedTypes?: MediaType[];
  existingMedia?: UploadedMedia[];
  className?: string;
  maxSizeMB?: number;
  intent?: UploadIntent;
  uploadParams?: Record<string, string>;
  lessonId?: string;
}

const EMPTY_ARRAY: UploadedMedia[] = [];

export function MediaUploader({
  onChange,
  maxFiles = 1,
  allowedTypes = ["image"],
  existingMedia = EMPTY_ARRAY,
  className,
  maxSizeMB = 5,
  intent = UploadIntent.POST_MEDIA,
  uploadParams = {},
  lessonId
}: MediaUploaderProps) {

  // --- State ---
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [completedFiles, setCompletedFiles] = useState<UploadedMedia[]>(existingMedia);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Sync prop changes (if parent updates existingMedia externally)
  useEffect(() => {
    // Deep compare or at least length/key check to avoid loop
    if (existingMedia === completedFiles) return;

    // Simple check: if lengths differ or if content differs (using JSON stringify for simple media objects is mostly fine)
    // A better check:
    const isSame = existingMedia.length === completedFiles.length &&
      existingMedia.every((m, i) => m.url === completedFiles[i].url && m.key === completedFiles[i].key);

    if (!isSame) {
      setCompletedFiles(existingMedia);
    }
  }, [existingMedia, completedFiles]);

  // --- Hooks ---
  const { uploadFile: startUpload, progress: uploadProgress } = useMediaUpload({
    intent,
  });

  // Ensure referential stability for callback
  const handleUploadError = useCallback((err: string) => {
    toast.error(err);
  }, []);

  const { uploadFile: startChunkedUpload, progress: chunkProgress } = useChunkedUpload({
    lessonId: lessonId || uploadParams.lessonId || "",
    onUploadError: handleUploadError
  });

  // Sync hook progress to the active uploading file
  useEffect(() => {
    // Optimization: Skip if no files are currently being tracked/uploaded
    if (files.length === 0) return;

    const progress = intent === UploadIntent.COURSE_LESSON_VIDEO ? chunkProgress : uploadProgress;

    setFiles(prev => {
      // Prevent state update if progress hasn't effectively changed to avoid loop
      // (Assuming simple primitive check is enough, but map always creates new ref)
      // Let's only map if we find an uploading file
      const hasUploading = prev.some(f => f.uploading);
      if (!hasUploading) return prev;

      return prev.map(f => f.uploading ? { ...f, progress } : f);
    });
  }, [uploadProgress, chunkProgress, intent, files.length]);

  // --- Upload Logic ---
  const uploadFile = async (file: File, id: string) => {
    try {
      // Logic for Lesson Video (Chunked)
      if (intent === UploadIntent.COURSE_LESSON_VIDEO) {
        if (!uploadParams.lessonId && !lessonId) {
          toast.error("Missing lessonId for video upload");
          setFiles(prev => prev.filter(f => f.id !== id));
          return;
        }

        const uploadedKey = await startChunkedUpload(file);

        // Success handling for video 
        setFiles(prev => prev.filter(f => f.id !== id));
        const newMedia: UploadedMedia = {
          url: "",
          key: uploadedKey || "pending-processing",
          name: file.name,
          type: "VIDEO"
        };

        // Update Local and Parent
        const updated = [...completedFiles, newMedia];
        setCompletedFiles(updated);
        onChange(updated);
        return;
      }

      // Logic for Regular Uploads
      let fileToUpload = file;
      const isImage = file.type.startsWith("image");

      if (isImage) {
        fileToUpload = await compressImage(file);
      }

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 0 } : f));

      const key = await startUpload(fileToUpload, uploadParams);

      // Success
      setFiles(prev => prev.filter(f => f.id !== id));

      const isPdf = fileToUpload.type === "application/pdf";
      const newMedia: UploadedMedia = {
        url: constructUrl(key),
        key,
        name: fileToUpload.name,
        type: isImage ? "IMAGE" : isPdf ? "PDF" : "VIDEO"
      };

      if (isImage) {
        newMedia.url = `${newMedia.url}?t=${Date.now()}`;
      }

      const updated = [...completedFiles, newMedia];
      setCompletedFiles(updated);
      onChange(updated);

      toast.success("Uploaded successfully");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Upload failed");
      setFiles(prev => prev.map(f => f.id === id ? { ...f, error: true, uploading: false } : f));
    }
  };

  // --- Remove Handler ---
  const removeFile = async (index: number, isUploading = false) => {
    if (isUploading) {
      setFiles(prev => prev.filter((_, i) => i !== index));
      return;
    }

    const fileToRemove = completedFiles[index];
    const uniqueId = fileToRemove.url || fileToRemove.key || String(index);
    setIsDeleting(uniqueId);

    if (fileToRemove.key) {
      try {
        const { deleteMediaAction } = await import("@/features/media/actions/delete-media.action");
        await deleteMediaAction(fileToRemove.key);

        // Success: Remove from UI
        const updated = completedFiles.filter((_, i) => i !== index);
        setCompletedFiles(updated);
        onChange(updated);
      } catch (error) {
        console.error("Failed to delete file from S3", error);
        toast.error("Failed to delete file from server");
      } finally {
        setIsDeleting(null);
      }
    } else {
      // No key, just remove local ref
      const updated = completedFiles.filter((_, i) => i !== index);
      setCompletedFiles(updated);
      onChange(updated);
      setIsDeleting(null);
    }
  };

  // --- Configuration ---
  const getAcceptConfig = () => {
    const config: Accept = {};

    if (allowedTypes.includes("image")) {
      config['image/png'] = [];
      config['image/jpeg'] = [];
      config['image/webp'] = [];
      config['image/avif'] = [];
    }

    if (allowedTypes.includes("video")) {
      config['video/mp4'] = [];
      config['video/webm'] = [];
    }

    if (allowedTypes.includes("pdf")) {
      config['application/pdf'] = [];
    }

    return config;
  }

  // --- Drop Handler ---
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ errors }) => {
        toast.error(errors[0]?.message || "Invalid file type or size");
      });
    }

    // Access current state via direct dependency or functional update if needed, 
    // but here we are inside component scope, need to be careful with stale closures in callbacks.
    // However, Dropzone calls this fresh. We need current 'completedFiles' and 'files' length.
    // We should rely on the closure values which are updated by 'onDrop' dependency array.

    if (completedFiles.length + files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    acceptedFiles.forEach(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        return;
      }

      const id = uuidv4();
      let type: "IMAGE" | "VIDEO" | "PDF" = "IMAGE";
      if (file.type.startsWith("video")) type = "VIDEO";
      if (file.type === "application/pdf") type = "PDF";

      const newFile: MediaFile = {
        id,
        file,
        preview: URL.createObjectURL(file), // Note: Need cleanup
        progress: 0,
        uploading: true,
        error: false,
        type
      };

      setFiles(prev => [...prev, newFile]);
      uploadFile(file, id);
    });
  }, [completedFiles, files, maxFiles, maxSizeMB, intent, uploadParams, lessonId]);
  // Added dependencies to ensure closure is fresh.

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptConfig(),
    maxFiles: maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: files.some(f => f.uploading) || completedFiles.length >= maxFiles
  });

  const getLabel = () => {
    const types = allowedTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" & ");
    return `${types} (Max ${maxSizeMB}MB)`;
  }

  return (
    <div className={cn("space-y-4", className)}>

      {/* PREVIEWS GRID */}
      {(completedFiles.length > 0 || files.length > 0) && (
        <div className={cn("grid gap-4", maxFiles > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>

          {/* Completed Files */}
          {completedFiles.map((media, idx) => (
            <div key={media.url || media.key || idx} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
              {media.type === "IMAGE" && (
                <Image
                  src={media.url}
                  alt="media"
                  fill
                  className="object-cover"
                />
              )}
              {media.type === "VIDEO" && (
                <div className="flex flex-col items-center justify-center p-4 bg-black/5">
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">Video Uploaded</p>
                </div>
              )}
              {media.type === "PDF" && (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-4">
                  <FileText className="w-12 h-12 mb-2" />
                  <span className="text-xs text-center truncate w-full px-2 text-foreground font-medium">PDF Document</span>
                  <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline mt-1">View</a>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeFile(idx)}
                disabled={isDeleting === (media.url || media.key || String(idx))}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-100 disabled:cursor-not-allowed z-20"
              >
                {isDeleting === (media.url || media.key || String(idx)) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>

              {/* Deletion Overlay */}
              {isDeleting === (media.url || media.key || String(idx)) && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                  <Loader2 className="w-8 h-8 animate-spin text-white/80" />
                </div>
              )}
            </div>
          ))}

          {/* Uploading Files */}
          {files.map((file, idx) => (
            <div key={file.id} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
              {file.type === "IMAGE" && (
                <Image src={file.preview} alt="preview" fill className="object-cover opacity-50" />
              )}
              {file.type === "VIDEO" && (
                <video src={file.preview} className="w-full h-full object-cover opacity-50" />
              )}
              {file.type === "PDF" && (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-4 opacity-50">
                  <FileText className="w-12 h-12 mb-2" />
                  <span className="text-xs">Uploading PDF...</span>
                </div>
              )}

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                {file.error ? (
                  <span className="text-destructive font-bold text-xs">Failed</span>
                ) : (
                  <div className="flex flex-col items-center bg-black/40 p-2 rounded-lg backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="text-xs font-bold text-white mt-1">
                      {file.progress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Cancel Upload */}
              <button
                type="button"
                onClick={() => removeFile(idx, true)}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-destructive transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DROPZONE AREA */}
      {completedFiles.length < maxFiles && (
        <Card
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/30",
            isDragActive && "border-primary bg-primary/5",
            files.length > 0 || completedFiles.length > 0 ? "h-24" : "h-32"
          )}
        >
          <CardContent className="flex flex-col items-center justify-center h-full text-center gap-2">
            <input {...getInputProps()} />
            <UploadCloud className={cn("w-8 h-8", isDragActive ? "text-primary" : "text-muted-foreground")} />
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
              <br />
              {getLabel()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

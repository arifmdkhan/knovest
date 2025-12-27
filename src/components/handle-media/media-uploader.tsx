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


// --- Types ---
interface MediaFile {
  id: string;
  file: File | null;
  preview: string;
  progress: number;
  uploading: boolean;
  error: boolean;
  key?: string;
  type: "IMAGE" | "VIDEO" | "PDF";
}

export interface UploadedMedia {
  url: string;
  name?: string;
  key?: string; // Needed for deletion
  type: "IMAGE" | "VIDEO" | "PDF";
}

export type MediaType = "image" | "video" | "pdf";

import { useMediaUpload } from "@/hooks/use-media-upload";
import { UploadIntent } from "@/lib/storage/types";
import { deleteMediaAction } from "@/server/actions/delete-media.actions"; // Import Action

// ... Types ...

interface MediaUploaderProps {
  onChange: (files: UploadedMedia[]) => void;
  maxFiles?: number;
  allowedTypes?: MediaType[];
  existingMedia?: UploadedMedia[];
  className?: string;
  maxSizeMB?: number;
  intent?: UploadIntent; // New Prop
  uploadParams?: Record<string, string>; // New Prop
}

export function MediaUploader({
  onChange,
  maxFiles = 1,
  allowedTypes = ["image"],
  existingMedia = [],
  className,
  maxSizeMB = 5,
  intent = UploadIntent.POST_MEDIA, // Default
  uploadParams = {}
}: MediaUploaderProps) {

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [completedFiles, setCompletedFiles] = useState<UploadedMedia[]>(existingMedia);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Use Hook for the "Active" file being uploaded (handling one at a time internally for simplicity, or parallel)
  // Since useMediaUpload is simple, we can wrap it per file or call it. 
  // Let's call the logic directly from the component mapping, as the hook maintains state for ONE upload at a time usually.
  // We can instantiate the hook logic or better, create a helper inside:

  const { uploadFile: startUpload, progress: uploadProgress } = useMediaUpload({
    intent,
    // callbacks handled per file below
  });

  // Sync hook progress to the active uploading file
  // Note: This assumes one file uploads at a time or they share progress (limitation of current hook usage)
  useEffect(() => {
    setFiles(prev => prev.map(f => f.uploading ? { ...f, progress: uploadProgress } : f));
  }, [uploadProgress]);

  // --- Upload Logic ---
  const uploadFile = async (file: File, id: string) => {
    try {
      let fileToUpload = file;
      const isImage = file.type.startsWith("image");

      // 1. Compress (only if image)
      if (isImage) {
        fileToUpload = await compressImage(file);
      }

      // Update Params if POST_MEDIA and no postId, we might need one.
      // Assuming parent provides valid uploadParams.

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 0 } : f)); // Reset to 0

      // 2. Upload via Hook
      // We need to capture progress. The hook exposes 'progress' state but it's shared.
      // For accurate per-file progress with this hook structure, we ideally need the hook to support a callback.
      // Assuming we've structured the hook to update its state, we can try to sync it, but it's tricky with multiple files.
      // Since we are likely uploading one large video at a time, we'll try to use the hook's progress for the *active* upload.

      const key = await startUpload(fileToUpload, uploadParams);

      // 4. Success
      setFiles(prev => prev.filter(f => f.id !== id));

      const isPdf = fileToUpload.type === "application/pdf";
      const newMedia: UploadedMedia = {
        url: constructUrl(key), // Convert Key to URL for Display
        key,
        name: fileToUpload.name,
        type: isImage ? "IMAGE" : isPdf ? "PDF" : "VIDEO"
      };

      // Cache busting for images to ensure updates show immediately
      if (isImage) {
        newMedia.url = `${newMedia.url}?t=${Date.now()}`;
      }

      setCompletedFiles(prev => {
        const updated = [...prev, newMedia];
        setTimeout(() => onChange(updated), 0);
        return updated;
      });

      toast.success("Uploaded successfully");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Upload failed");
      setFiles(prev => prev.map(f => f.id === id ? { ...f, error: true, uploading: false } : f));
    }
  };

  // --- Remove Handler (Integrated with DELETE API) ---
  const removeFile = async (index: number, isUploading = false) => {
    if (isUploading) {
      setFiles(prev => prev.filter((_, i) => i !== index));
      return;
    }

    const fileToRemove = completedFiles[index];

    if (fileToRemove.key) {
      try {
        setIsDeleting(fileToRemove.url);
        // Use Server Action
        const res = await deleteMediaAction(fileToRemove.key);

        if (res.status === "error") throw new Error(res.message || "Failed to delete");
        toast.success("File removed");
      } catch (error) {
        console.error(error);
        toast.error("Failed to remove file");
        setIsDeleting(null);
        return;
      } finally {
        setIsDeleting(null);
      }
    }

    setCompletedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setTimeout(() => onChange(updated), 0);
      return updated;
    });
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

    if (completedFiles.length + files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    acceptedFiles.forEach(file => {
      // Manual Size Check
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
        preview: URL.createObjectURL(file),
        progress: 0,
        uploading: true,
        error: false,
        type
      };

      setFiles(prev => [...prev, newFile]);
      uploadFile(file, id);
    });
  }, [completedFiles.length, files.length, maxFiles, maxSizeMB]);

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
            <div key={media.url} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
              {media.type === "IMAGE" && (
                <Image
                  src={media.url}
                  alt="media"
                  fill
                  className="object-cover"
                />
              )}
              {media.type === "VIDEO" && (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  controls
                />
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
                disabled={isDeleting === media.url}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-100 disabled:cursor-wait z-10"
              >
                {isDeleting === media.url ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
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

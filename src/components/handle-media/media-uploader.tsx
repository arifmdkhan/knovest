"use client";

import { useCallback, useState, useEffect } from "react";
import { FileRejection, useDropzone, Accept } from "react-dropzone";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  X,
  UploadCloud,
  Loader2
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
  type: "IMAGE" | "VIDEO";
}

export interface UploadedMedia {
  url: string;
  key?: string; // Needed for deletion
  type: "IMAGE" | "VIDEO";
}

interface MediaUploaderProps {
  onChange: (files: UploadedMedia[]) => void;
  maxFiles?: number;
  acceptedTypes?: "image" | "video" | "mixed";
  existingMedia?: UploadedMedia[];
  className?: string;
}

export function MediaUploader({
  onChange,
  maxFiles = 1,
  acceptedTypes = "mixed",
  existingMedia = [],
  className
}: MediaUploaderProps) {

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [completedFiles, setCompletedFiles] = useState<UploadedMedia[]>(existingMedia);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // --- Upload Logic ---
  const uploadFile = async (file: File, id: string) => {
    try {
      let fileToUpload = file;
      const isImage = file.type.startsWith("image");

      // 1. Compress (if image)
      if (isImage) {
        fileToUpload = await compressImage(file);
      }

      // 2. Get Presigned URL
      const res = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileToUpload.name,
          contentType: fileToUpload.type,
          size: fileToUpload.size,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { presignedUrl, url, key } = await res.json();


      // 3. Upload to S3
      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 50 } : f));

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: fileToUpload,
        headers: { "Content-Type": fileToUpload.type },
      });

      if (!uploadRes.ok) throw new Error("S3 Upload failed");

      // 4. Success
      setFiles(prev => prev.filter(f => f.id !== id)); // Remove from uploading list

      const newMedia: UploadedMedia = {
        url: constructUrl(key),
        key,
        type: (isImage ? "IMAGE" : "VIDEO") as "IMAGE" | "VIDEO"
      };


      // Safe State Update
      setCompletedFiles(prev => {
        const updated = [...prev, newMedia];
        setTimeout(() => onChange(updated), 0);
        return updated;
      });

      toast.success("Uploaded successfully");

    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
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
        const res = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: fileToRemove.key }),
        });

        if (!res.ok) throw new Error("Failed to delete");
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

  // --- Drop Handler ---
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ errors }) => {
        toast.error(errors[0]?.message || "Invalid file");
      });
    }

    if (completedFiles.length + files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    acceptedFiles.forEach(file => {
      const id = uuidv4();
      const type = file.type.startsWith("video") ? "VIDEO" : "IMAGE";

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
  }, [completedFiles.length, files.length, maxFiles]);

  const acceptConfig: Accept = {
    'image/png': [],
    'image/jpeg': [],
    'image/webp': [],
    'image/avif': [],
    ...(acceptedTypes !== 'image' ? {
      'video/mp4': [],
      'video/webm': []
    } : {})
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptConfig,
    maxFiles: maxFiles,
    disabled: files.some(f => f.uploading) || completedFiles.length >= maxFiles
  });



  return (
    <div className={cn("space-y-4", className)}>

      {/* PREVIEWS GRID */}
      {(completedFiles.length > 0 || files.length > 0) && (
        <div className={cn("grid gap-4", maxFiles > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>

          {/* Completed Files */}
          {completedFiles.map((media, idx) => (
            <div key={media.url} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
              {media.type === "IMAGE" ? (
                <Image
                  src={media.url}
                  alt="media"
                  fill
                  className="object-cover"

                />
              ) : (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  controls
                />
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
              {file.type === "IMAGE" ? (
                <Image src={file.preview} alt="preview" fill className="object-cover opacity-50" />
              ) : (
                <video src={file.preview} className="w-full h-full object-cover opacity-50" />
              )}

              <div className="z-10 flex flex-col items-center">
                {file.error ? (
                  <span className="text-destructive font-bold text-xs">Failed</span>
                ) : (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs font-medium text-primary mt-1">
                      {file.progress < 10 ? "Compressing..." : "Uploading..."}
                    </span>
                  </>
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
              {acceptedTypes === 'image' ? 'Images only' : 'Images & Videos'} (Max 50MB)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Camera, Loader2, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-compression";
import { constructUrl } from "@/lib/construct-url";
import { ImageCropper } from "@/components/ui/image-cropper";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { UploadIntent } from "@/lib/storage/types";

interface AvatarUploaderProps {
    value?: string | null;
    onChange: (url: string) => void;
    className?: string;
    intent?: UploadIntent;
    uploadParams?: Record<string, string>;
}

export function AvatarUploader({
    value,
    onChange,
    className,
    intent = UploadIntent.USER_AVATAR,
    uploadParams
}: AvatarUploaderProps) {
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // New Hook Usage
    const { uploadFile, isUploading } = useMediaUpload({
        intent,
        onUploadComplete: (key) => {
            // constructUrl handles keys gracefully
            const url = constructUrl(key);
            onChange(url);
            toast.success("Image updated");
            setCropperOpen(false);
            setSelectedImage(null);
        },
        onUploadError: (err) => {
            toast.error("Failed to upload image");
        }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setSelectedImage(reader.result as string);
                setCropperOpen(true);
            });
            reader.readAsDataURL(file);
            // Reset input so same file can be selected again if needed
            e.target.value = "";
        }
    };

    const handleUpload = async (fileBlob: Blob) => {
        // Create a temporary file
        const tempFile = new File([fileBlob], "avatar.png", { type: "image/png" });
        // Compress and convert to WebP using our utility
        const compressedFile = await compressImage(tempFile);

        await uploadFile(compressedFile, uploadParams);
    };

    return (
        <>
            <div className={cn("relative group cursor-pointer", className)} onClick={() => fileInputRef.current?.click()}>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />

                <div className="w-full h-full rounded-full overflow-hidden border-2 border-border bg-muted relative">
                    {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    ) : null}

                    {value ? (
                        <Image
                            src={value}
                            alt="Avatar"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                            <User className="w-1/2 h-1/2 stroke-1" />
                        </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                        <Camera className="w-8 h-8 text-white/90" />
                    </div>
                </div>
            </div>

            <ImageCropper
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                imageSrc={selectedImage}
                onCropComplete={handleUpload}
            />
        </>
    );
}

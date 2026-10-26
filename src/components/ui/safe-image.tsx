"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
    fallbackClassName?: string;
    fallbackIcon?: React.ReactNode;
    containerClassName?: string;
}

export function SafeImage({
    src,
    alt,
    className,
    fallbackClassName,
    fallbackIcon,
    ...props
}: SafeImageProps) {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [prevSrc, setPrevSrc] = useState(src);

    if (src !== prevSrc) {
        setPrevSrc(src);
        setError(false);
        setIsLoading(true);
    }

    if (error || !src) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center bg-muted text-muted-foreground w-full h-full min-h-[100px]",
                    className,
                    fallbackClassName
                )}
                role="img"
                aria-label={alt || "Image placeholder"}
            >
                {fallbackIcon || (
                    <div className="flex flex-col items-center gap-2">
                        <ImageOff className="h-8 w-8 opacity-50" />
                        <span className="text-xs font-medium opacity-70">Failed to load image</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            className={cn(
                "transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className
            )}
            onError={() => {
                setError(true);
                setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
            {...props}
            unoptimized={props.unoptimized || (typeof src === "string" && (src.startsWith("/api/posts/") || /[?&]X-Amz-Signature=/i.test(src)))}
        />
    );
}

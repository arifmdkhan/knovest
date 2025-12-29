"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecureVideoPlayerProps {
    courseId: string;
    lessonId: string;
    poster?: string;
    className?: string;
    autoPlay?: boolean;
}

export function SecureVideoPlayer({
    courseId,
    lessonId,
    poster,
    className,
    autoPlay = false
}: SecureVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // The secure stream URL is our API route
    // Note: We use the API route directly as the src.
    // The browser will follow the redirect standardly.
    const streamUrl = `/api/courses/${courseId}/lessons/${lessonId}/stream`;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Event listeners for custom state if needed
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleError = () => setError("Failed to load video stream.");

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("error", handleError);

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("error", handleError);
        };
    }, []);

    // Prevent context menu (Right Click)
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        return false;
    };

    return (
        <div
            className={cn(
                "relative bg-black rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10 group select-none",
                className
            )}
            onContextMenu={handleContextMenu}
        >
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-center p-4">
                    <AlertTriangle className="size-10 text-red-500 mb-2" />
                    <p className="text-white font-medium">Video Unavailable</p>
                    <p className="text-white/50 text-xs">You may not have permission to view this content.</p>
                </div>
            ) : (
                <>
                    {/* 
                        Native Video Element 
                        - controlsList="nodownload" is a hint to Chrome to hide download button
                        - onContextMenu prevents right click
                    */}
                    <video
                        ref={videoRef}
                        src={streamUrl}
                        poster={poster}
                        controls
                        controlsList="nodownload"
                        playsInline
                        className="w-full h-full object-contain"
                        autoPlay={autoPlay}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <track kind="captions" />
                    </video>

                    {/* 
                        Transparent Overlay 
                        Blocks drag-and-drop of the video file to desktop/tabs 
                    */}
                    <div
                        className="absolute inset-0 z-10 pointer-events-none"
                        aria-hidden="true"
                    />
                </>
            )}
        </div>
    );
}

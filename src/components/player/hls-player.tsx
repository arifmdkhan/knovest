"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HLSPlayerProps {
    src: string;
    poster?: string;
    className?: string;
    autoPlay?: boolean;
}

export const HLSPlayer = ({ src, poster, className, autoPlay = false }: HLSPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: Hls | null = null;
        let recoveries = 0;
        const onMetadata = () => { setIsLoading(false); if (autoPlay) void video.play().catch(() => {}); };
        const onError = () => { setError("Playback unavailable. Reload this lesson to try again."); setIsLoading(false); };

        const initPlayer = () => {
            setIsLoading(true);
            setError(null);

            if (Hls.isSupported()) {
                hls = new Hls({
                    // Ensure cookies are sent with requests if needed (same-origin usually auto-sends)
                    xhrSetup: (xhr) => {
                        xhr.withCredentials = true;
                    },
                    // Optimization settings
                    enableWorker: true,
                    lowLatencyMode: true,
                });

                hls.loadSource(src);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsLoading(false);
                    if (autoPlay) {
                        video.play().catch(() => {
                            // Auto-play might be blocked
                        });
                    }
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        if (++recoveries > 3) { onError(); hls?.destroy(); return; }
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error("HLS Network Error", data);
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error("HLS Media Error", data);
                                hls?.recoverMediaError();
                                break;
                            default:
                                console.error("HLS Fatal Error", data);
                                setError("Playback error");
                                hls?.destroy();
                                break;
                        }
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                // Native HLS support 
                video.src = src;
                video.addEventListener("loadedmetadata", onMetadata);
                video.addEventListener("error", onError);
            } else {
                setError("HLS is not supported in this browser.");
                setIsLoading(false);
            }
        };

        initPlayer();

        return () => {
            if (hls) {
                hls.destroy();
            }
            if (video) {
                video.removeEventListener("loadedmetadata", onMetadata);
                video.removeEventListener("error", onError);
              
                video.removeAttribute("src");
                video.load();
            }
        };
    }, [src, autoPlay]);

    return (
        <div className={cn("relative aspect-video bg-black rounded-md overflow-hidden group", className)}>
            <video
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain focus:outline-none"
                controls
                playsInline
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <p className="text-white text-sm font-medium">{error}</p>
                </div>
            )}
        </div>
    );
};

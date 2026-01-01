"use client";

import { useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { useTheme } from "next-themes";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface GlobalVideoProviderProps {
    children: React.ReactNode;
    user: {
        id: string;
        name: string;
        image?: string | null;
    };
    streamToken: string;
}

export default function GlobalVideoProvider({ children, user, streamToken }: GlobalVideoProviderProps) {
    const { theme } = useTheme();

    // [PERFORMANCE] Initialize client using lazy initial state to avoid useEffect delay.
    // This allows the provider to render children IMMEDIATELY without a loading spinner.
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(() => {
        if (!user || !streamToken) return null;
        
        const streamUser: User = {
            id: user.id,
            name: user.name,
            image: user.image || undefined,
        };

        return StreamVideoClient.getOrCreateInstance({ apiKey, user: streamUser, token: streamToken });
    });

    useEffect(() => {
        // Handle updates if user/token changes (rare in session, but good for correctness)
        // If client already exists and matches user, getOrCreateInstance returns the singleton.
        if (!user || !streamToken) return;

        const streamUser: User = {
            id: user.id,
            name: user.name,
            image: user.image || undefined,
        };

        const client = StreamVideoClient.getOrCreateInstance({ apiKey, user: streamUser, token: streamToken });
        setVideoClient(client);
        
        // No disconnect on unmount to prevent tearing down shared singleton if used elsewhere
    }, [user.id, user.name, user.image, streamToken]);

    if (!videoClient) {
        // Fallback only if accessed without user/token (should not happen in protected routes)
        // Even here, we prefer rendering children if possible, but StreamVideo needs client.
        // If no client, we can't provide context.
        return <>{children}</>; 
    }

    return (
        <StreamVideo client={videoClient}>
            {children}
        </StreamVideo>
    );
}

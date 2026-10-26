"use client";

import { useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { getStreamToken } from "@/features/media/actions/stream.action";
import { registerStreamCleanup } from "@/lib/stream-lifecycle";

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
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
    const enabled = !!streamToken;

    useEffect(() => {
        if (!apiKey || !enabled) return;

        const streamUser: User = {
            id: user.id,
            name: user.name,
            image: user.image || undefined,
        };

        const client = new StreamVideoClient({ apiKey, user: streamUser, tokenProvider: async () => {
            const result = await getStreamToken({});
            if (result.status !== "success" || !result.data) throw new Error("Connection authorization expired");
            return result.data;
        } });
        setVideoClient(client);
        const disconnect = async () => {
            await Promise.allSettled(client.state.calls.map(call => call.leave()));
            await client.disconnectUser();
        };
        const unregister = registerStreamCleanup(disconnect);
        return () => { unregister(); void disconnect().catch(() => {}); };
    }, [user.id, user.name, user.image, enabled]);

    if (!videoClient) {
        // Fallback only if accessed without user/token (should not happen in protected routes)
        return <>{children}</>; 
    }

    return (
        <StreamVideo client={videoClient}>
            {children}
        </StreamVideo>
    );
}

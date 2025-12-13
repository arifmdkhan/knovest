"use client";

import { useEffect, useState, useMemo } from "react";
import { StreamVideo, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
// import "@stream-io/video-react-sdk/dist/css/styles.css"; // Moved to route-specific layouts
// import "stream-chat-react/dist/css/v2/index.css"; // Moved to route-specific layouts
import { useTheme } from "next-themes";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface PlatformStreamProviderProps {
    children: React.ReactNode;
    user: {
        id: string;
        name: string;
        image?: string | null;
    };
    streamToken: string;
}

export default function PlatformStreamProvider({ children, user, streamToken }: PlatformStreamProviderProps) {
    const { theme } = useTheme();
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);

    useEffect(() => {
        if (!user || !streamToken) return;

        const streamUser: User = {
            id: user.id,
            name: user.name,
            image: user.image || undefined,
        };

        const client = new StreamVideoClient({ apiKey, user: streamUser, token: streamToken });
        setVideoClient(client);

        return () => {
            client.disconnectUser();
        };
    }, [user.id, user.name, user.image, streamToken]);

    useEffect(() => {
        if (!user || !streamToken) return;

        const client = StreamChat.getInstance(apiKey);

        const connectChat = async () => {
            try {
                if (client.userID !== user.id) {
                    await client.connectUser(
                        {
                            id: user.id,
                            name: user.name,
                            image: user.image || undefined,
                        },
                        streamToken
                    );
                }
            } catch (error) {
                console.error("Failed to connect chat user", error);
            }
        };

        connectChat();
        setChatClient(client);

        return () => {
            // Optional: Disconnect chat client on unmount. 
            // Often we leave it connected for SPA navigation, but strict cleanup is better.
            // verifying if we should disconnect. 
            // If we disconnect, next page load might need to reconnect.
            // For now, let's NOT disconnect chat client forcefully on every unmount to avoid "User token not set" if component remounts fast.
            // But strict mode might be an issue. 
            // Let's rely on getInstance singleton behavior but ensure connection.
        };
    }, [user.id, user.name, user.image, streamToken]);

    const streamTheme = theme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";

    if (!videoClient || !chatClient) return <>{children}</>; // Or loading state

    return (
        <StreamVideo client={videoClient}>
            <Chat client={chatClient} theme={streamTheme}>
                {children}
            </Chat>
        </StreamVideo>
    );
}

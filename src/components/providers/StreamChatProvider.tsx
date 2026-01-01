"use client";

import { useMemo, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import { useTheme } from "next-themes";
import "stream-chat-react/dist/css/v2/index.css";
import "@/styles/stream-chat.css";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface StreamChatProviderProps {
    children: React.ReactNode;
    user: {
        id: string;
        name: string;
        image?: string | null;
        email?: string | null;
    };
    streamToken: string;
    themePrefix?: string;
}

export function StreamChatProvider({ children, user, streamToken, themePrefix = "team-chat-theme" }: StreamChatProviderProps) {
    const { theme } = useTheme();

    const chatClient = useMemo(() => {
        return StreamChat.getInstance(apiKey);
    }, []);

    useEffect(() => {
        if (chatClient.userID !== user.id) {
            chatClient.connectUser(
                {
                    id: user.id,
                    name: user.name,
                    image: user.image || undefined,
                },
                streamToken
            ).catch(err => console.error("Failed to connect chat user in StreamChatProvider", err));
        }
    }, [chatClient, user.id, user.name, user.image, streamToken]);

    const streamTheme = theme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";

    return (
        <Chat client={chatClient} theme={`${streamTheme} ${themePrefix}`}>
            {children}
        </Chat>
    );
}

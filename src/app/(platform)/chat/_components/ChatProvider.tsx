"use client";

import { useMemo, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
// import "stream-chat-react/dist/css/v2/index.css"; // Moved to lazy loaded components
import "@/app/chat-theme.css";
import { useTheme } from "next-themes";
import { ChatLayout } from "./ChatLayout";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface ChatProviderProps {
    children: React.ReactNode;
    user: {
        id: string;
        name: string;
        image?: string | null;
        email?: string | null;
    };
    streamToken: string;
}

export function ChatProvider({ children, user, streamToken }: ChatProviderProps) {
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
            ).catch(err => console.error("Failed to connect chat user in ChatProvider", err));
        }
    }, [chatClient, user.id, user.name, user.image, streamToken]);

    const streamTheme = theme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";

    return (
        <div className="h-[calc(100vh-4rem)] w-full bg-background rounded-lg">
            <Chat client={chatClient} theme={`${streamTheme} team-chat-theme`}>
                <ChatLayout sessionUser={user}>
                    {children}
                </ChatLayout>
            </Chat>
        </div>
    );
}

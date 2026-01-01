"use client";

import { StreamChatProvider } from "@/components/providers/StreamChatProvider";
import { ChatLayout } from "./ChatLayout";

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
    return (
        <div className="h-[calc(100vh-4rem)] w-full bg-background rounded-lg">
            <StreamChatProvider user={user} streamToken={streamToken} themePrefix="team-chat-theme">
                <ChatLayout sessionUser={user}>
                    {children}
                </ChatLayout>
            </StreamChatProvider>
        </div>
    );
}

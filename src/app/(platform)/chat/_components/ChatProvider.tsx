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
        expertVerificationType?: string | null;
    };
}

export function ChatProvider({ children, user }: ChatProviderProps) {
    return (
        <div className="h-[calc(100svh-8rem)] min-h-[480px] w-full bg-background rounded-2xl">
            <StreamChatProvider themePrefix="team-chat-theme">
                <ChatLayout sessionUser={user}>
                    {children}
                </ChatLayout>
            </StreamChatProvider>
        </div>
    );
}

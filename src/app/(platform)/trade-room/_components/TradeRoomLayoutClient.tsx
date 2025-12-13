"use client";

import { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Loader2 } from "lucide-react";
import { TradeRoomProvider } from "./TradeRoomContext";

interface TradeRoomLayoutClientProps {
    children: React.ReactNode;
    user: {
        id: string;
        name: string;
        image?: string | null;
    };
}

export default function TradeRoomLayoutClient({ children, user }: TradeRoomLayoutClientProps) {
    const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);

    // We expect the Chat context to be provided by the global PlatformStreamProvider
    const { client: chatClient } = useChatContext();

    useEffect(() => {
        if (!chatClient || !user) return;

        const fetchGroups = async () => {
            try {
                // Ensure client is connected? Global provider handles this.
                // But we should check if userID matches just in case? 
                // Context client is stable.

                const channels = await chatClient.queryChannels(
                    {
                        type: 'messaging',
                        members: { $in: [user.id] }
                    },
                    { last_message_at: -1 }
                );
                setMyGroupIds(channels.map(c => c.id!));
            } catch (error) {
                console.error("Failed to fetch user groups", error);
            } finally {
                setIsLoadingGroups(false);
            }
        };

        fetchGroups();
    }, [chatClient, user.id]);

    // If chatClient is not available (e.g. global provider loading), we might show loader.
    // But global provider shows loader while init.
    // So chatClient should be ready here if this component is rendered.
    // UNLESS stream-chat-react context behaves differently.
    // It should be fine.

    if (!chatClient) {
        // Fallback safety
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <TradeRoomProvider value={{ myGroupIds, isLoadingGroups }}>
            <div className="w-full bg-background rounded-lg">
                {children}
            </div>
        </TradeRoomProvider>
    );
}

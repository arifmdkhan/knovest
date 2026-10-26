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
    const { client: chatClient } = useChatContext();

    useEffect(() => {
        if (!chatClient || !user) return;

        const fetchGroups = async () => {
            try {
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
            <div className="trade-room-content w-full min-w-0 bg-background rounded-lg">
                {children}
            </div>
        </TradeRoomProvider>
    );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
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
    const { client: chatClient } = useChatContext();
    const groups = useQuery({
        queryKey: ["room-groups", user.id],
        enabled: !!chatClient,
        ...contentQueryOptions,
        queryFn: async () => {
            if (!chatClient) throw new Error("Chat connection unavailable");
            const channels = await chatClient.queryChannels({ type: "messaging", members: { $in: [user.id] } }, { last_message_at: -1 });
            return channels.map(channel => channel.id!).filter(Boolean);
        },
    });
    const myGroupIds = groups.data || [];
    const isLoadingGroups = groups.isPending;

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
                <QueryFeedback {...groups} hasData={groups.data !== undefined} />
                {children}
            </div>
        </TradeRoomProvider>
    );
}

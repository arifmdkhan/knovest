"use client";

import { useEffect, useState, use } from "react";
import { Channel as StreamChannel, Event } from "stream-chat";
import {
    Channel,
    Window,
    MessageList,
    MessageInput,
    Thread,
    MessageSimple,
    MessageUIComponentProps,
    useMessageContext,
    useChatContext,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { useRouter } from "next/navigation";
import { CustomChannelHeader } from "../_components/ChannelHeader";
import { CustomChannelData } from "@/lib/chat-types";
import { ChatSkeleton } from "../_components/ChatSkeleton";
import { authClient } from "@/lib/auth-client";
import { PremiumBackground } from "../_components/PremiumBackground";
import { User } from "@/generated/prisma/client";


interface PageProps {
    params: Promise<{ channelId: string }>;
}

// Custom Message Component to handle time-based actions
const CustomMessage = (props: MessageUIComponentProps) => {
    const messageContext = useMessageContext();
    const { client } = useChatContext();
    const [tick, setTick] = useState(0); // Used to force re-render

    const message = messageContext?.message || props.message;

    // Set up timers to force re-render when permissions expire
    useEffect(() => {
        if (!message?.created_at) return;

        const created = new Date(message.created_at);
        const now = new Date();
        const elapsed = now.getTime() - created.getTime();

        const fiveMinutes = 5 * 60 * 1000;
        const fifteenMinutes = 15 * 60 * 1000;

        const timers: NodeJS.Timeout[] = [];

        if (elapsed < fiveMinutes) {
            const timeUntilEditExpiry = fiveMinutes - elapsed;
            timers.push(setTimeout(() => setTick(t => t + 1), timeUntilEditExpiry));
        }

        if (elapsed < fifteenMinutes) {
            const timeUntilDeleteExpiry = fifteenMinutes - elapsed;
            timers.push(setTimeout(() => setTick(t => t + 1), timeUntilDeleteExpiry));
        }

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [message?.created_at]);

    if (!message) return null;

    const actions = ['reply', 'react', 'pin', 'quote'];

    let isOwner = false;
    if (messageContext?.isMyMessage && typeof messageContext.isMyMessage === 'function') {
        isOwner = messageContext.isMyMessage();
    } else if (client?.userID && message.user?.id) {
        isOwner = message.user.id === client.userID;
    }

    if (isOwner) {
        const now = new Date();
        // Fallback to now if created_at is missing (e.g. optimistic message), 
        // but prefer message.created_at. If it's effectively "now", it's editable.
        const created = message.created_at ? new Date(message.created_at) : now;
        const diffInMinutes = (now.getTime() - created.getTime()) / (1000 * 60);

        // Edit: 5 minute limit
        if (diffInMinutes <= 5) {
            actions.push('edit');
        }

        // Delete: 15 minute limit
        if (diffInMinutes <= 15) {
            actions.push('delete');
        }
    } else {
        actions.push('flag', 'mute');
    }

    return <MessageSimple {...props} getMessageActions={() => actions} />;
};

export default function ChannelPage({ params }: PageProps) {
    const { channelId } = use(params);
    const { client } = useChatContext();
    const { data: session } = authClient.useSession();
    const [channel, setChannel] = useState<StreamChannel | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!client || !channelId) return;

        const loadChannel = async () => {
            // Check if channel is already active in client to avoid re-fetching
            const existingChannel = client.activeChannels[channelId];
            if (existingChannel) {
                setChannel(existingChannel);
                return;
            }

            const newChannel = client.channel("messaging", channelId);
            // Only watch if not already initialized
            if (!newChannel.initialized) {
                await newChannel.watch();
            }
            setChannel(newChannel);

            // Handle channel deletion while viewing
            const handleEvent = (event: Event) => {
                if (event.type === 'channel.deleted') {
                    setChannel(null);
                    router.push('/chat');
                }
            };

            newChannel.on('channel.deleted', handleEvent);

            return () => {
                newChannel.off('channel.deleted', handleEvent);
            };
        };

        loadChannel();
    }, [client, channelId, router]);

    if (!channel) {
        return <ChatSkeleton />;
    }

    // Permission check for sending messages
    const canSendMessage = (() => {
        const sendPermission = (channel.data as CustomChannelData)?.permissions?.send_messages;
        const userRole = channel.state.members[client.userID!]?.role;
        const isCreator = channel.data?.created_by?.id === client.userID;

        if (isCreator) return true;
        if (!sendPermission || sendPermission === "everyone") return true;
        if (sendPermission === "moderator") return userRole === "owner" || userRole === "moderator";
        if (sendPermission === "admin") return userRole === "owner";
        return false;
    })();

    // Type guard/assertion for subscription (assuming it's on the user object extended)
    const isSubscriptionEnabled = (session?.user as User)?.isSubscriptionEnabled ?? false;

    return (
        <div className="flex h-full w-full flex-col relative">
            <Channel channel={channel} key={channel.id}>
                <Window>
                    <CustomChannelHeader
                        onBackAction={() => router.push('/chat')}
                        isSubscriptionEnabled={isSubscriptionEnabled}
                    />
                    <div className="flex-1 relative min-h-0 flex flex-col">
                        <PremiumBackground className="h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex-1 relative min-h-0">
                                    <MessageList
                                        Message={CustomMessage}
                                    />
                                </div>
                                <div className="p-4 z-10 bg-background/80 backdrop-blur-md border-t border-border/40">
                                    {!canSendMessage ? (
                                        <div className="p-4 bg-muted/50 rounded-xl text-muted-foreground text-center text-sm border border-border/50">
                                            Only {(channel.data as CustomChannelData)?.permissions?.send_messages === 'moderator' ? 'admins and moderators' : 'admins'} can send messages in this group.
                                        </div>
                                    ) : (
                                        <MessageInput focus />
                                    )}
                                </div>
                            </div>
                        </PremiumBackground>
                    </div>
                </Window>
                <Thread />
            </Channel>
        </div>
    );
}

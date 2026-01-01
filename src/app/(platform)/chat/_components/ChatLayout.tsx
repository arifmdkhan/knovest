"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";
import { useChatContext } from "stream-chat-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateChatDialog } from "./ChatDialogue";
import { usePathname, useRouter } from "next/navigation";
import { Event } from "stream-chat";
import { ChatSidebarSkeleton } from "./ChatSidebarSkeleton";

const ChatSidebarList = dynamic(() => import("./ChatSidebarList"), {
    loading: () => <ChatSidebarSkeleton />,
    ssr: false // No SSR for channel list as it depends on client chat state
});

interface ChatLayoutProps {
    children: React.ReactNode;
    sessionUser: {
        id: string;
        name: string;
        image?: string | null;
        email?: string | null;
    };
}

export function ChatLayout({ children, sessionUser }: ChatLayoutProps) {
    const { client } = useChatContext();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Determine if we are on the main list page or a specific channel
    const isChannelPage = pathname.startsWith("/chat/") && pathname.length > 6;

    // Handle removal from channel
    useEffect(() => {
        if (!client) return;

        const handleEvent = (event: Event) => {
            if (event.type === 'notification.removed_from_channel' || event.type === 'channel.deleted') {
                if (event.user?.id === client.userID) return;
                const channelId = event.channel?.id;
                if (channelId && pathname.includes(channelId)) {
                    router.push('/chat');
                }
            }
        };

        client.on('notification.removed_from_channel', handleEvent);
        client.on('channel.deleted', handleEvent);

        return () => {
            client.off('notification.removed_from_channel', handleEvent);
            client.off('channel.deleted', handleEvent);
        };
    }, [client, pathname, router]);

    return (
        <div className="flex h-full w-full bg-background relative overflow-hidden rounded-xl shadow-sm border border-border/40">

            {/* LEFT: Channel List Sidebar */}
            <div className={cn(
                // Shared Styles
                "h-full flex flex-col bg-muted/10 transition-all duration-300 ease-in-out z-20 border-r border-border/60",
                // Mobile Styles: 
                isChannelPage ? "hidden md:flex" : "flex w-full",
                // Desktop Styles: Fixed width
                "md:w-[380px] lg:w-[420px]" // Slightly wider for a clearer view
            )}>
                {/* Header */}
                <div className="px-6 py-5 flex justify-between items-center shrink-0">
                    <h1 className="font-bold text-2xl tracking-tight text-foreground">Messages</h1>
                    <Button
                        onClick={() => setShowCreateDialog(true)}
                        size="icon"
                        variant="ghost"
                        className="rounded-full h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all shadow-sm"
                        title="New Chat"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                {/* Channel List - Lazy Loaded */}
                <ChatSidebarList sessionUserId={sessionUser.id} />
            </div>

            {/* RIGHT: Chat Window / Empty State */}
            <div
                className={cn(
                    "h-full flex-1 bg-background relative flex flex-col z-30",
                    !isChannelPage ? "hidden md:flex" : "flex w-full"
                )}
            >
                {children}
            </div>

            <CreateChatDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                canCreateGroup={!!(sessionUser as any)?.expertVerificationType}
            />
        </div>
    );
}

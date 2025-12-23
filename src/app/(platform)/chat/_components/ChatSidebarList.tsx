"use client";

import { useMemo } from "react";
import { ChannelList } from "stream-chat-react";
import { ChannelPreview } from "./ChannelPreview";
import { CustomChannelSearch } from "./CustomChannelSearch";
import { usePathname, useRouter } from "next/navigation";
import { Channel } from "stream-chat";
import "stream-chat-react/dist/css/v2/index.css";

interface ChatSidebarListProps {
    sessionUserId: string;
}

export default function ChatSidebarList({ sessionUserId }: ChatSidebarListProps) {
    const pathname = usePathname();
    const router = useRouter();

    const filters = useMemo(() => {
        return {
            type: 'messaging',
            members: { $in: [sessionUserId] },
            $or: [
                { last_message_at: { $gt: '1970-01-01T00:00:00Z' } },
                { name: { $exists: true } },
                { demo: 'app' }
            ]
        } as any;
    }, [sessionUserId]);

    const sort = useMemo(() => ({ last_message_at: -1 } as const), []);

    const handleChannelSelect = (channel: Channel) => {
        router.push(`/chat/${channel.id}`);
    };

    return (
        <div className="flex-1 overflow-y-auto pb-3 custom-scrollbar flex flex-col">
            <CustomChannelSearch />
            <div className="space-y-1 px-3">
                <ChannelList
                    filters={filters}
                    sort={sort}
                    key={sessionUserId}
                    Preview={(props) => (
                        <ChannelPreview
                            {...props}
                            onSelect={() => handleChannelSelect(props.channel)}
                            active={pathname === `/chat/${props.channel.id}`}
                        />
                    )}
                />
            </div>
        </div>
    );
}

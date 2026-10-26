"use client";

import { createContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getStreamToken } from "@/features/media/actions/stream.action";
import { registerStreamCleanup } from "@/lib/stream-lifecycle";
import { StreamChat } from "stream-chat";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface StreamChatConnectionProviderProps {
    children: React.ReactNode;
    user: {
        id: string;
        name: string;
        image?: string | null;
        email?: string | null;
    };
    streamToken: string;
}

type Connection = { userId: string; client: StreamChat | null; failed: boolean };
export const StreamConnectionContext = createContext<{ enabled: boolean; connection: Connection | null } | null>(null);

/** Keep one connection for the platform session, starting on the first live page. */
export function StreamChatConnectionProvider({ children, user, streamToken }: StreamChatConnectionProviderProps) {
    const pathname = usePathname();
    const isLivePage = pathname === "/chat" || pathname.startsWith("/chat/") || pathname === "/trade-room" || pathname.startsWith("/trade-room/");
    const [activated, setActivated] = useState(isLivePage);
    // Latch activation so route changes do not tear down an established socket.
    if (isLivePage && !activated) setActivated(true);
    const [connection, setConnection] = useState<Connection | null>(null);
    const enabled = !!apiKey && !!streamToken;

    useEffect(() => {
        if (!enabled || !activated) return;
        const client = new StreamChat(apiKey);
        let disposed = false;
        const connecting = client.connectUser(
                {
                    id: user.id,
                    name: user.name,
                    image: user.image || undefined,
                },
                async () => {
                    const result = await getStreamToken({});
                    if (result.status !== "success" || !result.data) throw new Error("Connection authorization expired");
                    return result.data;
                }
            ).then(() => {
                if (!disposed) setConnection({ userId: user.id, client, failed: false });
            }).catch(() => {
                if (!disposed) setConnection({ userId: user.id, client: null, failed: true });
            });
        const disconnect = async () => { await connecting; await client.disconnectUser(); };
        const unregister = registerStreamCleanup(disconnect);
        return () => {
            disposed = true;
            unregister();
            setConnection(null);
            void disconnect().catch(() => {});
        };
    }, [user.id, user.name, user.image, enabled, activated]);

    const currentConnection = connection?.userId === user.id ? connection : null;
    return <StreamConnectionContext.Provider value={{ enabled, connection: currentConnection }}>{children}</StreamConnectionContext.Provider>;
}


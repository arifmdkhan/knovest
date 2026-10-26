"use client";

import { useContext } from "react";
import { Chat } from "stream-chat-react";
import { useTheme } from "next-themes";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StreamConnectionContext } from "./StreamChatConnectionProvider";
import "stream-chat-react/dist/css/v2/index.css";
import "@/styles/stream-chat.css";

/** Route-local UI; the socket belongs to the persistent platform layout. */
export function StreamChatProvider({ children, themePrefix = "team-chat-theme", skeleton = "chat" }: {
    children: React.ReactNode;
    themePrefix?: string;
    skeleton?: "chat" | "room";
}) {
    const context = useContext(StreamConnectionContext);
    const { resolvedTheme } = useTheme();
    if (!context) throw new Error("StreamChatConnectionProvider is missing");
    const { enabled, connection } = context;
    const streamTheme = resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";
    const chatClient = connection?.client;

    if (enabled && !connection?.failed && !chatClient) {
        return <PageSkeleton variant={skeleton} />;
    }

    if (!enabled || !chatClient) {
        return <div className="app-panel flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center" role="status">
            <h1 className="text-xl font-semibold">Live connections are unavailable</h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">Messages and live rooms are temporarily unavailable. Please try again later.</p>
        </div>;
    }

    return (
        <Chat client={chatClient} theme={`${streamTheme} ${themePrefix}`}>
            {children}
        </Chat>
    );
}

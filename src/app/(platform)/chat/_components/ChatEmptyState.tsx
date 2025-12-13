"use client";

import { MessageSquareDashed } from "lucide-react";

export function ChatEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-sm backdrop-blur-sm">
                <MessageSquareDashed className="w-8 h-8 text-primary/80" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground/80 mb-1">
                No messages yet
            </h3>
            <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
                Send a message to start the conversation. It's quiet in here...
            </p>
        </div>
    );
}

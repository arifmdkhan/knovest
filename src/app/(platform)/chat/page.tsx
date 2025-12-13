"use client";

import { PremiumBackground } from "./_components/PremiumBackground";
import { MessageSquareDashed } from "lucide-react";

export default function ChatPage() {
    return (
        <PremiumBackground className="hidden md:block h-full w-full">
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center space-y-4 p-8 rounded-2xl bg-background/40 backdrop-blur-sm border border-border/20 shadow-xl max-w-md mx-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner ring-1 ring-primary/20">
                        <MessageSquareDashed className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold tracking-tight">Welcome to Messages</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Select a chat from the sidebar to start messaging or create a new group.
                        </p>
                    </div>
                </div>
            </div>
        </PremiumBackground>
    );
}
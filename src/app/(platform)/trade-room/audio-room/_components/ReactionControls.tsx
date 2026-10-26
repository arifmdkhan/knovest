"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REACTIONS = [
    { emoji: "👍", label: "Thumbs Up" },
    { emoji: "❤️", label: "Love" },
    { emoji: "😂", label: "Laugh" },
    { emoji: "👏", label: "Clap" },
    { emoji: "🔥", label: "Fire" },
    { emoji: "🎉", label: "Party" },
];

export const ReactionControls = () => {
    const call = useCall();
    const sendReaction = async (emoji: string) => {
        if (!call) return;
        try {
            await call.sendReaction({
                type: "reaction",
                emoji,
                custom: { emoji }
            } as any);
        } catch (error) {
            console.error("Failed to send reaction", error);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" aria-label="Send a reaction" className="gap-2">
                    <Smile className="h-4 w-4" />
                    <span className="hidden sm:inline">React</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[calc(100vw-24px)] p-2 bg-popover border-border" side="top" sideOffset={10}>
                <div className="flex flex-wrap gap-1">
                    {REACTIONS.map(({ emoji, label }) => (
                        <button
                            key={label}
                            onClick={() => sendReaction(emoji)}
                            className="text-2xl hover:scale-125 transition-transform p-2 rounded-lg hover:bg-accent"
                            title={label}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

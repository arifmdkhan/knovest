"use client";

import { Call } from "@stream-io/video-react-sdk";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const REACTIONS = [
    { emoji: "👍", label: "Thumbs Up" },
    { emoji: "❤️", label: "Love" },
    { emoji: "😂", label: "Laugh" },
    { emoji: "👏", label: "Clap" },
    { emoji: "🔥", label: "Fire" },
    { emoji: "🎉", label: "Party" },
];

export const ReactionControls = ({ call, onReaction }: { call: Call, onReaction?: (emoji: string) => void }) => {
    const sendReaction = async (emoji: string) => {
        try {
            if (onReaction) onReaction(emoji);
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
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                    <Smile className="h-4 w-4" />
                    <span className="hidden sm:inline">React</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-zinc-900 border-zinc-800" side="top" sideOffset={10}>
                <div className="flex gap-2">
                    {REACTIONS.map(({ emoji, label }) => (
                        <button
                            key={label}
                            onClick={() => sendReaction(emoji)}
                            className="text-2xl hover:scale-125 transition-transform p-2 rounded-lg hover:bg-white/10"
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

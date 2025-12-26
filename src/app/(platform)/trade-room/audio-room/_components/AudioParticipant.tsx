"use client";

import { useStreamVideoClient, Call, ParticipantView, StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";


interface AudioParticipantProps {
    participant: StreamVideoParticipant;
    reaction?: { emoji: string; type: string };
    role: string;
}

export const AudioParticipant = ({ participant, reaction, role }: AudioParticipantProps) => {
    const { isSpeaking } = participant;
    const isMicEnabled = participant.publishedTracks.includes('audio' as any);

    return (
        <div className="flex flex-col items-center gap-3 relative group transition-all duration-300 hover:scale-105">
            {/* Audio Visualization Ring */}
            <div className={cn(
                "rounded-full p-[3px] transition-all duration-300 relative",
                isSpeaking ? "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-violet-500 animate-spin-slow" : "bg-zinc-200/80 dark:bg-white/10"
            )}>
                {/* Glow Effect */}
                {isSpeaking && <div className="absolute inset-0 rounded-full bg-violet-500 blur-md opacity-50 animate-pulse"></div>}

                <div className="relative z-10 text-center">
                    <Avatar className="h-24 w-24 md:h-28 md:w-28 border-[4px] border-background dark:border-black ring-1 ring-zinc-200 dark:ring-white/10 shadow-2xl">
                        <AvatarImage src={participant.image} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-black text-foreground dark:text-white text-3xl font-bold flex items-center justify-center">
                            {participant.name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                    </Avatar>

                    {/* Mute Status Indicator */}
                    <div className={cn(
                        "absolute bottom-1 right-1 rounded-full p-2 shadow-lg border border-border dark:border-white/10 z-20 transition-all duration-300",
                        isMicEnabled ? "bg-white/80 dark:bg-black/80 backdrop-blur-md" : "bg-red-500/90"
                    )}>
                        {isMicEnabled ? (
                            <Mic className={cn("h-3.5 w-3.5", isSpeaking ? "text-violet-500 dark:text-violet-400 animate-pulse" : "text-emerald-600 dark:text-emerald-400")} />
                        ) : (
                            <MicOff className="h-3.5 w-3.5 text-white" />
                        )}
                    </div>

                    {/* Reaction Overlay */}
                    {reaction && (
                        <div className="absolute -top-4 -right-4 text-5xl animate-bounce drop-shadow-lg z-30 pointer-events-none select-none filter drop-shadow-white">
                            {reaction.emoji}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center space-y-1">
                <p className="font-bold text-base text-foreground dark:text-white truncate max-w-[140px] drop-shadow-sm dark:drop-shadow-md tracking-tight leading-none">
                    {participant.name || participant.userId}
                </p>
                <div className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block border backdrop-blur-sm",
                    role === 'host'
                        ? "bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/30"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20"
                )}>
                    {role === 'host' ? 'Host' : 'Speaker'}
                </div>
            </div>

            {/* Audio handling is done globally in the page component to prevent echo/throttling */}
        </div>
    );
};

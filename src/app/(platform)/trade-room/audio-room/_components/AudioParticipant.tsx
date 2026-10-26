"use client";

import { hasAudio, type StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function AudioParticipant({ participant, reaction, role }: { participant: StreamVideoParticipant; reaction?: { emoji: string; type: string }; role: string }) {
    const enabled = hasAudio(participant);
    return <div className="audio-participant" data-speaking={participant.isSpeaking}>
        <div className="audio-avatar-ring">
            <Avatar className="audio-speaker-avatar"><AvatarImage src={participant.image} /><AvatarFallback>{participant.name?.charAt(0) || "S"}</AvatarFallback></Avatar>
            <span className={cn("audio-mic-indicator", enabled && "is-enabled")} aria-label={enabled ? "Microphone on" : "Microphone muted"}>
                {enabled ? <Mic size={12} /> : <MicOff size={12} />}
            </span>
            {reaction && <span className="audio-speaker-reaction">{reaction.emoji}</span>}
        </div>
        <p title={participant.name}>{participant.name || "Speaker"}</p>
        <span className="audio-role">{role === "host" ? "Host" : "Speaker"}</span>
    </div>;
}

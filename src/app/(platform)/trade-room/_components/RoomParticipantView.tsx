"use client";

import { DefaultParticipantViewUI, ParticipantView, hasAudio, hasVideo, useCall, useParticipantViewContext, type ParticipantViewProps, type VideoPlaceholderProps } from "@stream-io/video-react-sdk";
import { Mic, MicOff, Video, VideoOff, MonitorUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function CameraOffPlaceholder({ participant, className, ref, ...props }: VideoPlaceholderProps) {
    return <div ref={ref} className={cn("room-camera-off", className)} {...props}>
        <div className="room-avatar-halo"><Avatar className="room-card-avatar">
            <AvatarImage src={participant.image || undefined} />
            <AvatarFallback>{participant.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("") || "P"}</AvatarFallback>
        </Avatar></div>
        <span className="room-camera-off-label"><VideoOff size={13} />Camera off</span>
    </div>;
}

function ParticipantCardUI() {
    const { participant, trackType } = useParticipantViewContext();
    const call = useCall();
    const microphoneOn = hasAudio(participant);
    const cameraOn = hasVideo(participant);
    const isHost = participant.userId === call?.state.createdBy?.id;
    const sharing = trackType === "screenShareTrack";

    return <>
        <DefaultParticipantViewUI />
        <div className="room-card-footer">
            <span className="room-speaking-dot" data-speaking={participant.isSpeaking} aria-hidden="true" />
            <div className="room-card-identity"><span className="room-card-name" title={participant.name}>{participant.name || "Participant"}{participant.isLocalParticipant && <span className="room-card-you"> (You)</span>}</span>
                <span className="room-card-role">{sharing ? "Screen sharing" : isHost ? "Host" : "Participant"}</span>
            </div>
            <div className="room-card-device-status">
                <span data-enabled={microphoneOn} aria-label={microphoneOn ? "Microphone on" : "Microphone muted"}>{microphoneOn ? <Mic size={14} /> : <MicOff size={14} />}</span>
                <span data-enabled={cameraOn || sharing} aria-label={sharing ? "Sharing screen" : cameraOn ? "Camera on" : "Camera off"}>{sharing ? <MonitorUp size={14} /> : cameraOn ? <Video size={14} /> : <VideoOff size={14} />}</span>
            </div>
        </div>
    </>;
}

export function RoomParticipantView({ className, ...props }: ParticipantViewProps) {
    return <ParticipantView {...props} className={cn("room-participant-card", className)} VideoPlaceholder={CameraOffPlaceholder} ParticipantViewUI={ParticipantCardUI} />;
}

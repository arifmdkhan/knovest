"use client";

import { Call, useStreamVideoClient, StreamCall, useCallStateHooks, ParticipantView } from "@stream-io/video-react-sdk";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { MiniPlayer } from "@/components/audio-room/MiniPlayer";

interface ActiveCallContextType {
    activeCall: Call | null;
    joinRoom: (roomId: string) => Promise<void>;
    leaveRoom: () => Promise<void>;
    isJoining: boolean;
}

const ActiveCallContext = createContext<ActiveCallContextType>({
    activeCall: null,
    joinRoom: async () => { },
    leaveRoom: async () => { },
    isJoining: false,
});

export const useActiveCall = () => useContext(ActiveCallContext);

export const ActiveCallProvider = ({ children }: { children: ReactNode }) => {
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const client = useStreamVideoClient();
    const router = useRouter();

    const joinRoom = async (roomId: string) => {
        if (!client) return;

        // If already in this room, do nothing
        if (activeCall?.id === roomId) return;

        // If in another room, leave it first
        if (activeCall) {
            await activeCall.leave();
        }

        setIsJoining(true);
        try {
            const call = client.call('audio_room', roomId);
            await call.join({ create: true });
            setActiveCall(call);
        } catch (error) {
            console.error("Failed to join room", error);
            toast.error("Failed to join audio room");
            throw error;
        } finally {
            setIsJoining(false);
        }
    };

    const leaveRoom = async () => {
        if (!activeCall) return;
        try {
            await activeCall.leave();
            setActiveCall(null);
            toast.success("Left audio room");
        } catch (error) {
            console.error("Failed to leave room", error);
        }
    };

    return (
        <ActiveCallContext.Provider value={{ activeCall, joinRoom, leaveRoom, isJoining }}>
            {activeCall ? (
                <StreamCall call={activeCall}>
                    {children}
                    <GlobalAudioHandler call={activeCall} />
                </StreamCall>
            ) : (
                children
            )}
            {activeCall && <MiniPlayer call={activeCall} />}
        </ActiveCallContext.Provider>
    );
};

const GlobalAudioHandler = ({ call }: { call: Call }) => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const pathname = usePathname();
    const isOnCallPage = pathname?.includes(`/trade-room/audio-room/${call.id}`);

    // If we are on the call page, IT handles the audio/video rendering.
    if (isOnCallPage) return null;

    // Otherwise, we render hidden participant views here to keep audio alive.
    return (
        <div className="hidden">
            {participants
                .filter(p => p.isSpeaking || p.roles.includes('speaker') || p.roles.includes('host') || !p.isLocalParticipant)
                .map(p => (
                    <ParticipantView key={p.sessionId} participant={p} />
                ))}
        </div>
    );
};

"use client";

import {
    Call,
    StreamCall,
    StreamTheme,
    SpeakerLayout,
    useCallStateHooks,
    ParticipantView
} from "@stream-io/video-react-sdk";
import React, { useEffect, useState } from "react";
import { useChatContext, Channel, MessageList, MessageInput, Window, Thread } from "stream-chat-react";
import { ManageAccessDialog } from "./ManageAccessDialog";
import { StreamControls } from "./StreamControls";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaDeviceSettings } from "./MediaDeviceSettings";
import { Loader2, MessageSquare, X, Link, Users, Share2, Shield, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CustomCallData } from "@/types/stream";
import { authClient } from "@/lib/auth-client";

interface LivestreamPlayerProps {
    call: Call;
}

export const LivestreamPlayer = React.memo(function LivestreamPlayer({ call }: LivestreamPlayerProps) {
    const { data: session } = authClient.useSession();
    const { client: chatClient } = useChatContext();
    // Permission Check - REMOVED: Managed by parent Page component
    // If we are here, we have access.

    // We can keep customData for title/desc but not for permission validation.


    return (
        <StreamCall call={call}>
            <LivestreamContent call={call} />
        </StreamCall>
    );
});

function LivestreamContent({ call }: { call: Call }) {
    const router = useRouter();
    const { client: chatClient } = useChatContext();
    const [chatChannel, setChatChannel] = useState<any>(null);
    const [showChat, setShowChat] = useState(true);
    const { useCallState, useParticipants } = useCallStateHooks();
    const { backstage } = useCallState();
    const participants = useParticipants();
    const [isBackstage, setIsBackstage] = useState(backstage);
    const [showManageAccess, setShowManageAccess] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const checkCustomData = (data: Record<string, unknown> | undefined): CustomCallData => {
        return (data || {}) as CustomCallData;
    };

    const customData = checkCustomData(call.state.custom);

    // Deduplicate participants based on userId, prioritizing those with active tracks
    // This prevents showing a 'ghost' (disconnected) participant instead of the real (connected) one
    const uniqueParticipants = React.useMemo(() => {
        const grouped = participants.reduce((acc, p) => {
            if (!acc[p.userId]) {
                acc[p.userId] = p;
            } else {
                // If we already have this user, check if the new one is 'better'
                // Better means: Has video or audio track
                const current = acc[p.userId];
                const currentHasVideo = current.videoStream || current.publishedTracks.includes('video' as any);
                const currentHasAudio = current.audioStream || current.publishedTracks.includes('audio' as any);

                const newHasVideo = p.videoStream || p.publishedTracks.includes('video' as any);
                const newHasAudio = p.audioStream || p.publishedTracks.includes('audio' as any);

                // If new one has tracks and current doesn't, swap
                if ((newHasVideo || newHasAudio) && (!currentHasVideo && !currentHasAudio)) {
                    acc[p.userId] = p;
                }
                // If both have tracks or neither, maybe prefer the newer one? (Usually later in list?)
            }
            return acc;
        }, {} as Record<string, typeof participants[0]>);

        return Object.values(grouped);
    }, [participants]);

    useEffect(() => {
        setIsBackstage(backstage);
    }, [backstage]);

    // Listen for call ended event (for participants)
    useEffect(() => {
        const handleCallEnded = () => {
            toast.info("Stream ended by host");
            router.push("/trade-room");
        };

        call.on('call.ended', handleCallEnded);

        return () => {
            call.off('call.ended', handleCallEnded);
        };
    }, [call, router]);

    // Initialize Chat Channel for this stream
    useEffect(() => {
        if (!chatClient || !call.id) return;

        const initChat = async () => {
            const channel = chatClient.channel('livestream', call.id, {
                name: customData.title || "Livestream Chat",
            } as any);
            await channel.watch();
            setChatChannel(channel);
        };

        initChat();
    }, [chatClient, call.id, customData.title]);

    // Check for Secure Context (HTTPS)
    useEffect(() => {
        // navigator.mediaDevices is undefined in insecure contexts (HTTP)
        const isSecure = typeof window !== 'undefined' && window.isSecureContext;
        if (!isSecure) {
            toast.error("Insecure Connection Detected", {
                description: "Browsers block Camera/Microphone on HTTP. Please use HTTPS or localhost to enable audio/video.",
                duration: Infinity, // Make it stick so they see it
                action: {
                    label: "Dismiss",
                    onClick: () => console.log("Dismissed insecure warning")
                }
            });
        }
    }, []);

    // Show waiting screen if stream is backstage and we are not the creator
    const isCreator = (call.state as any).createdBy?.id === chatClient?.userID;

    if (isBackstage && !isCreator) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white flex-col gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-violet-900/20 via-zinc-950 to-black pointer-events-none"></div>
                <div className="relative group">
                    <div className="absolute -inset-4 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 blur-xl opacity-50 animate-pulse group-hover:opacity-75 transition-opacity duration-500"></div>
                    <div className="relative bg-zinc-900/90 backdrop-blur-xl rounded-full p-6 ring-1 ring-white/10 shadow-2xl">
                        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
                    </div>
                </div>
                <div className="text-center z-10 space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-white to-zinc-400">Stream Starting Soon</h3>
                    <p className="text-zinc-500 font-medium">The host is preparing backstage.</p>
                </div>
            </div>
        );
    }

    const handleLeave = () => {
        router.push('/trade-room');
    };

    return (
        <StreamTheme className="livestream-chat-theme">
            <div className="flex h-full w-full bg-zinc-950 text-white overflow-hidden relative font-sans">
                {/* Main Video Area */}
                <div className="flex-1 flex flex-col h-full w-full relative">
                    <div className="flex-1 relative bg-zinc-900/50 w-full h-full">
                        {uniqueParticipants.length === 1 ? (
                            <ParticipantView
                                participant={uniqueParticipants[0]}
                                className="h-screen w-full object-cover"
                            />
                        ) : (
                            <SpeakerLayout
                                participantsBarPosition="top"
                            />
                        )}

                        {/* Stream Title Overlay */}
                        <div className="absolute top-6 left-6 z-10 pointer-events-none max-w-[calc(100%-4rem)] sm:max-w-md">
                            <div className="bg-black/40 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/5 shadow-2xl">
                                <h1 className="text-lg font-bold text-white truncate leading-tight">
                                    {customData.title || "Untitled Stream"}
                                </h1>
                                {customData.description && (
                                    <p className="text-xs text-zinc-300 truncate mt-1 font-medium opacity-90">
                                        {customData.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Overlay Controls */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6 pointer-events-none">
                            <div className="flex gap-3 items-center pointer-events-auto p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                                {isCreator && isBackstage && (
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await call.goLive();
                                                setIsBackstage(false); // Optimistic update
                                                await call.get(); // Refresh state
                                                toast.success("You are now live!");
                                            } catch (error) {
                                                console.error("Failed to go live", error);
                                                toast.error("Failed to go live");
                                            }
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-full px-6 font-semibold shadow-emerald-900/20 shadow-lg transition-all active:scale-95"
                                    >
                                        Go Live
                                    </Button>
                                )}
                                {isCreator && !isBackstage && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={async () => {
                                            try {
                                                await call.stopLive();
                                                await call.endCall(); // Terminate call for everyone
                                                toast.success("Stream ended");
                                                router.push("/trade-room");
                                            } catch (error) {
                                                console.error("Failed to end stream", error);
                                                toast.error("Failed to end stream");
                                            }
                                        }}
                                        className="rounded-full px-6 font-semibold shadow-red-900/20 shadow-lg active:scale-95 transition-all"
                                    >
                                        End Stream
                                    </Button>
                                )}

                                <div className="h-6 w-px bg-white/20 mx-1"></div>

                                <div className="flex gap-2 shrink-0 items-center">
                                    <StreamControls call={call} onLeave={handleLeave} />

                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-none shrink-0 h-10 w-10 transition-colors"
                                        onClick={() => setShowSettings(true)}
                                        title="Audio & Video Settings"
                                    >
                                        <Settings2 className="h-4.5 w-4.5" />
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-none shrink-0 h-10 w-10 transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success("Stream link copied");
                                        }}
                                        title="Copy Link" // Tooltip
                                    >
                                        <Share2 className="h-4.5 w-4.5" />
                                    </Button>

                                    {isCreator && (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-none shrink-0 h-10 w-10 transition-colors"
                                            onClick={() => setShowManageAccess(true)}
                                            title="Manage Access"
                                        >
                                            <Shield className="h-4.5 w-4.5" />
                                        </Button>
                                    )}

                                    <Button
                                        variant={showChat ? "default" : "secondary"}
                                        size="icon"
                                        className={cn(
                                            "rounded-full shrink-0 h-10 w-10 transition-colors border-none",
                                            showChat ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                                        )}
                                        onClick={() => setShowChat(!showChat)}
                                    >
                                        <MessageSquare className="h-4.5 w-4.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar (Responsive) */}
                <div className={
                    cn(
                        "absolute z-20 backdrop-blur-2xl bg-black/80 sm:bg-zinc-950/90 border-l border-white/5 shadow-2xl transform transition-all duration-300 ease-in-out",
                        "top-0 right-0 bottom-0 w-full sm:top-0 sm:right-0 sm:bottom-0 sm:w-[380px] sm:h-full",
                        showChat ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
                    )
                }>
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <div className="bg-violet-500/20 p-1.5 rounded-lg">
                                <MessageSquare className="h-4 w-4 text-violet-400" />
                            </div>
                            <h3 className="font-semibold text-white tracking-tight text-sm">Live Chat</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowChat(false)}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="h-[calc(100%-65px)] relative flex flex-col">
                        {chatChannel && (
                            <Channel channel={chatChannel} >
                                <Window>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                        <MessageList
                                            disableDateSeparator
                                            hideDeletedMessages
                                            messageActions={['react', 'reply']}
                                        />
                                    </div>
                                    <div className="p-4 bg-zinc-900/50 backdrop-blur-md border-t border-white/5">
                                        <MessageInput focus />
                                    </div>
                                </Window>
                            </Channel>
                        )}
                    </div>
                </div>
            </div>

            <ManageAccessDialog
                open={showManageAccess}
                onOpenChange={setShowManageAccess}
                call={call}
            />

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Audio & Video Settings</DialogTitle>
                    </DialogHeader>
                    <MediaDeviceSettings />
                </DialogContent>
            </Dialog>
        </StreamTheme>
    );
}

"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useStreamVideoClient, Call, StreamTheme, useCallStateHooks, ParticipantView } from "@stream-io/video-react-sdk";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Mic, MicOff, Users, Hand, LogOut, Settings, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTradeRoomContext } from "../../_components/TradeRoomContext";
import { useActiveCall } from "@/components/providers/ActiveCallProvider";
import { ReactionControls } from "../_components/ReactionControls";
import { AudioParticipant } from "../_components/AudioParticipant";
import { ParticipantMenu, SpeakerMenu } from "../_components/ParticipantMenu";
import { DeviceSettings } from "../_components/DeviceSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomCallData } from "@/types/stream";

// Main Room Content
const ActiveRoom = ({ call }: { call: Call }) => {
    const router = useRouter();
    const { useParticipants, useCallState, useLocalParticipant } = useCallStateHooks();
    const rawParticipants = useParticipants();
    const localParticipant = useLocalParticipant();
    const { backstage, members } = useCallState();
    const { leaveRoom } = useActiveCall();

    const [hasMedia, setHasMedia] = useState(false);
    useEffect(() => {
        setHasMedia(typeof navigator !== 'undefined' && !!navigator.mediaDevices);
    }, []);

    const [isBackstage, setIsBackstage] = useState(backstage);
    const [showSettings, setShowSettings] = useState(false);

    // Manage reactions locally
    const [latestReactions, setLatestReactions] = useState<Record<string, any>>({});
    // Manage raised hands locally
    const [raisedHands, setRaisedHands] = useState<string[]>([]);

    const showReaction = (userId: string, reaction: any) => {
        setLatestReactions(prev => ({ ...prev, [userId]: reaction }));
        setTimeout(() => {
            setLatestReactions(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        }, 4000);
    };

    const handleLocalReaction = (emoji: string) => {
        if (!localParticipant?.userId) return;
        showReaction(localParticipant.userId, { emoji, type: 'reaction' });
    };

    const customData = (call.state.custom || {}) as CustomCallData;

    // Force update triggers
    const [tick, setTick] = useState(0);

    // Check for Secure Context (HTTPS)
    useEffect(() => {
        const isSecure = typeof window !== 'undefined' && window.isSecureContext;
        if (!isSecure) {
            toast.error("Insecure Connection Detected", {
                description: "Browsers block Camera/Microphone on HTTP. Please use HTTPS or localhost.",
                duration: Infinity,
                action: { label: "Dismiss", onClick: () => { } }
            });
        }
    }, []);

    useEffect(() => {
        if (!call) return;

        const update = async (e?: any) => {
            setTick(t => t + 1);

            // On role/member updates, force a refresh of the members list
            if (e?.type === 'members.updated' || e?.type === 'call.permissions_updated' || e?.type === 'participant.updated') {
                try {
                    await call.queryMembers({
                        sort: [{ field: 'created_at', direction: -1 }],
                        limit: 100
                    });
                } catch (err) {
                    console.warn("Failed to refresh members", err);
                }
            }
        };

        call.on('participant.joined' as any, update);
        call.on('participant.left' as any, update);
        call.on('participant.updated' as any, update);
        call.on('members.updated' as any, update);
        call.on('call.updated' as any, update);
        call.on('call.permissions_updated' as any, update);

        return () => {
            call.off('participant.joined' as any, update);
            call.off('participant.left' as any, update);
            call.off('participant.updated' as any, update);
            call.off('members.updated' as any, update);
            call.off('call.updated' as any, update);
            call.off('call.permissions_updated' as any, update);
        };
    }, [call]);

    const participants = useMemo(() => {
        const uniqueParticipantsMap = new Map();

        rawParticipants.forEach(p => {
            if (!uniqueParticipantsMap.has(p.userId)) {
                uniqueParticipantsMap.set(p.userId, p);
            } else {
                const existing = uniqueParticipantsMap.get(p.userId);

                const pHasAudio = p.publishedTracks.includes('audio' as any);
                const pHasVideo = p.publishedTracks.includes('video' as any);
                const existingHasAudio = existing.publishedTracks.includes('audio' as any);
                const existingHasVideo = existing.publishedTracks.includes('video' as any);

                // Helper to score connection quality/relevance
                const getScore = (participant: any, hasAudio: boolean, hasVideo: boolean) => {
                    let score = 0;
                    if (hasAudio) score += 10;
                    if (hasVideo) score += 5;
                    if (participant.isSpeaking) score += 2;
                    return score;
                }

                const pScore = getScore(p, pHasAudio, pHasVideo);
                const existingScore = getScore(existing, existingHasAudio, existingHasVideo);

                if (pScore > existingScore) {
                    uniqueParticipantsMap.set(p.userId, p);
                }
            }
        });

        return Array.from(uniqueParticipantsMap.values());
    }, [rawParticipants, tick]);

    const isHost = localParticipant?.roles?.includes('host') ||
        localParticipant?.roles?.includes('admin') ||
        call.state.createdBy?.id === localParticipant?.userId;

    useEffect(() => {
        setIsBackstage(backstage);
    }, [backstage]);

    const callState = useCallState();
    useEffect(() => {
        console.log("Call State Keys:", Object.keys(callState));
    }, []);

    // Listen for reactions and raised hands
    useEffect(() => {
        if (!call) return;

        const handleReaction = (event: any) => {
            const { reaction } = event;
            const user = reaction?.user || event.user;

            // Debug Remote Events
            const isLocal = user?.id === call.state.localParticipant?.userId;

            if (user && reaction) {
                // Robust extraction
                const emoji = reaction.emoji || reaction.custom?.emoji;
                if (!emoji) return;

                // Normalize for UI
                const normalizedReaction = { ...reaction, emoji };

                setLatestReactions(prev => ({
                    ...prev,
                    [user.id]: normalizedReaction
                }));

                // Clear reaction after 4s
                setTimeout(() => {
                    setLatestReactions(prev => {
                        const next = { ...prev };
                        delete next[user.id];
                        return next;
                    });
                }, 4000);
            }
        };

        call.on('reaction_new' as any, handleReaction);
        call.on('call.reaction_new' as any, handleReaction);

        return () => {
            call.off('reaction_new' as any, handleReaction);
            call.off('call.reaction_new' as any, handleReaction);
        };
    }, [call]);



    const requestMicrophone = async () => {
        try {
            await call.requestPermissions({ permissions: ['send-audio'] });
            toast.success("Requested permission to speak");
        } catch (err) {
            console.error(err);
            toast.error("Failed to request permission");
        }
    };

    useEffect(() => {
        if (!isHost) return;

        const handlePermissionRequest = (event: any) => {
            const { user, permissions } = event;
            if (permissions.includes('send-audio')) {
                setRaisedHands(prev => [...prev, user.id]);

                toast.info(`${user.name || user.id} requested to speak`, {
                    action: {
                        label: 'Grant',
                        onClick: async () => {
                            await call.grantPermissions(user.id, [...permissions, 'screenshare']);
                            await call.updateCallMembers({
                                update_members: [{ user_id: user.id, role: 'speaker' }]
                            });
                            setRaisedHands(prev => prev.filter(id => id !== user.id));
                            toast.success(`Granted permission to ${user.name || user.id}`);
                        }
                    },
                    cancel: {
                        label: 'Deny',
                        onClick: () => {
                            setRaisedHands(prev => prev.filter(id => id !== user.id));
                            toast.dismiss();
                        }
                    },
                    duration: 10000
                });
            }
        };

        call.on('call.permission_request', handlePermissionRequest);

        return () => {
            call.off('call.permission_request', handlePermissionRequest);
        };
    }, [call, isHost]);

    useEffect(() => {
        if (!call) return;
        const onCallEnded = () => {
            toast.info("Host ended the session");
            router.push('/trade-room');
        };
        call.on('call.ended', onCallEnded);
        return () => call.off('call.ended', onCallEnded);
    }, [call, router]);

    const handleLeaveRoom = async () => {
        await leaveRoom();
        router.push('/trade-room');
    };

    const handleGoLive = async () => {
        try {
            await call.goLive();
            setIsBackstage(false);
            toast.success("You are now live!");
        } catch (error) {
            console.error("Failed to go live", error);
            toast.error("Failed to go live");
        }
    };

    const handleEndSession = async () => {
        try {
            await call.stopLive();
            await call.endCall();
            await leaveRoom();
            toast.success("Session ended");
            router.push('/trade-room');
        } catch (error) {
            console.error("Failed to end session", error);
            toast.error("Failed to end session");
        }
    };


    // Helper for role detection
    const getMainRole = (p: any) => {
        if (!p) return 'user';
        if (p.userId === call.state.createdBy?.id) return 'host';

        const member = members?.find((m: any) => m.user_id === p.userId || m.user?.id === p.userId);
        if (member) {
            if (member.role === 'host' || member.role === 'admin') return 'host';
            if (member.role === 'speaker') return 'speaker';
            if (member.role === 'user') return 'user';
        }

        if (p.roles?.includes('host') || p.roles?.includes('admin')) return 'host';
        if (p.roles?.includes('speaker')) return 'speaker';

        return 'user';
    };

    if (isBackstage && !isHost) {
        return (
            <div className="flex flex-col h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-black items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-violet-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-black/50 p-6 rounded-full border border-violet-500/30">
                        <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Room Starting Soon</h2>
                <p className="text-slate-400 max-w-md">The host is currently backstage getting ready.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-black">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]", isBackstage ? "bg-yellow-500 shadow-yellow-500/50" : "bg-red-500 shadow-red-500/50")}></div>
                        {customData.title || "Untitled Room"}
                        {isBackstage && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/30">Backstage</span>}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 pl-6">{customData.description || "Live Audio Discussion"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <Users className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium text-slate-200">
                            {participants.length} Listening
                        </span>
                    </div>
                </div>
            </div>

            {/* Stage Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    {/* Speakers Section */}
                    <div className="mb-12">
                        <h2 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <span className="bg-violet-500/20 p-1 rounded-sm"><Mic className="h-3 w-3" /></span>
                            Speakers & Host
                        </h2>
                        <div className="flex flex-wrap justify-center gap-10 md:gap-16">
                            {participants
                                .filter(p => getMainRole(p) === 'host' || getMainRole(p) === 'speaker')
                                .map((p) => (
                                    <div key={p.sessionId}>
                                        <SpeakerMenu participant={p} call={call} isHost={isHost}>
                                            <div>
                                                <AudioParticipant participant={p} reaction={latestReactions[p.userId]} role={getMainRole(p)} />
                                            </div>
                                        </SpeakerMenu>
                                    </div>
                                ))}
                            {participants.filter(p => getMainRole(p) === 'host' || getMainRole(p) === 'speaker').length === 0 && (
                                <div className="text-slate-500 text-sm italic py-10">Waiting for speakers...</div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10"></div>

                    {/* Listeners Section */}
                    <div>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Hand className="h-3 w-3" /> Audience
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {participants
                                .filter(p => getMainRole(p) === 'user')
                                .map((p) => (
                                    <div key={p.sessionId}>
                                        <ParticipantMenu participant={p} call={call} isHost={isHost}>
                                            <div className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group select-none",
                                                raisedHands.includes(p.userId) ? "bg-violet-900/20 border border-violet-500/30" : "")}>
                                                <div className="relative">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={p.image} />
                                                        <AvatarFallback className="text-xs">{p.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>

                                                    {latestReactions[p.userId] && (
                                                        <div className="absolute -top-1 -right-1 text-lg z-30 animate-bounce">
                                                            {latestReactions[p.userId].emoji}
                                                        </div>
                                                    )}

                                                    {raisedHands.includes(p.userId) && (
                                                        <div className="absolute -bottom-1 -right-1 bg-violet-500 text-white rounded-full p-0.5 z-30">
                                                            <Hand className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{p.name}</span>
                                            </div>
                                        </ParticipantMenu>
                                    </div>
                                ))}
                            {participants.filter(p => getMainRole(p) === 'user').length === 0 && (
                                <div className="text-slate-600 text-sm col-span-full">The audience is quiet...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10" onClick={() => setShowSettings(true)}>
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        {isHost && isBackstage && (
                            <Button size="sm" onClick={handleGoLive} className="bg-green-600 hover:bg-green-700 text-white border-none rounded-full px-6">
                                Go Live
                            </Button>
                        )}
                        {isHost && !isBackstage && (
                            <Button size="sm" variant="destructive" onClick={handleEndSession} className="rounded-full px-6">
                                End Session
                            </Button>
                        )}

                        <ReactionControls call={call} onReaction={handleLocalReaction} />

                        <div className="flex items-center gap-2">
                            {hasMedia && (getMainRole(localParticipant) === 'host' || getMainRole(localParticipant) === 'speaker') && (
                                <MicControl call={call} />
                            )}

                            <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-full h-10 w-10 p-0 bg-red-600 hover:bg-red-700"
                                onClick={handleLeaveRoom}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {getMainRole(localParticipant) === 'user' && (
                            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 gap-2" onClick={requestMicrophone}>
                                <Hand className="h-4 w-4" />
                                <span className="hidden sm:inline">Raise Hand</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <DeviceSettings open={showSettings} onOpenChange={setShowSettings} call={call} />

            {/* Global Audio Subscription - Hidden but in DOM for audio playback */}
            <div className="absolute top-0 left-0 w-[1px] h-[1px] opacity-0 overflow-hidden pointer-events-none">
                {participants.map(p => (
                    <ParticipantView
                        key={p.sessionId}
                        participant={p}
                    // Only mount audio/video tracks. We can disable video if we only want audio, 
                    // but Stream Video SDK usually needs video track enabled for "ParticipantView" to work fully, 
                    // or we use <Audio> component if available. 
                    // ParticipantView handles both.
                    />
                ))}
            </div>
        </div>
    );
};

const MicControl = ({ call }: { call: Call }) => {
    const { useMicrophoneState } = useCallStateHooks();
    const { status: micStatus, devices: audioDevices } = useMicrophoneState();

    const toggleMic = async () => {
        try {
            await call.microphone.toggle();
        } catch (err) {
            console.error("Failed to toggle microphone", err);
            toast.error("Microphone toggle failed");
        }
    }

    return (
        <div className="flex items-center rounded-full bg-white/10 p-0.5">
            <Button
                size="sm"
                variant={micStatus === 'enabled' ? "secondary" : "destructive"}
                className={cn("rounded-l-full rounded-r-none h-9 pl-3 pr-2 transition-colors border-r border-black/10",
                    micStatus === 'enabled' ? "bg-white text-black hover:bg-slate-200" : "bg-red-500 text-white hover:bg-red-600")}
                onClick={toggleMic}
            >
                {micStatus === 'enabled' ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                <span className="text-xs font-semibold">{micStatus === 'enabled' ? 'Mute' : 'Unmute'}</span>
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        size="sm"
                        variant={micStatus === 'enabled' ? "secondary" : "destructive"}
                        className={cn("rounded-r-full rounded-l-none h-9 px-2 transition-colors",
                            micStatus === 'enabled' ? "bg-white text-black hover:bg-slate-200" : "bg-red-500 text-white hover:bg-red-600")}
                    >
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1 bg-zinc-900 border-zinc-800 text-white" align="end" side="top">
                    <div className="text-xs font-semibold text-zinc-400 px-2 py-2 uppercase tracking-wider">Microphone Input</div>
                    <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
                        {audioDevices.length === 0 && <div className="px-2 py-1 text-sm text-zinc-500">No devices found</div>}
                        {audioDevices.map(d => (
                            <button
                                key={d.deviceId}
                                onClick={async () => {
                                    try { await call.microphone.select(d.deviceId); toast.success(`Microphone set to ${d.label}`); }
                                    catch (e) { toast.error("Failed to select device"); }
                                }}
                                className={cn("flex items-center justify-between text-sm px-2 py-2 rounded hover:bg-white/10 transition-colors w-full text-left",
                                    call.microphone.state.selectedDevice === d.deviceId ? "text-violet-400 bg-violet-500/10" : "text-zinc-300")}
                            >
                                <span className="truncate flex-1 pr-2">{d.label || `Mic ${d.deviceId.slice(0, 4)}...`}</span>
                                {call.microphone.state.selectedDevice === d.deviceId && <Check className="h-3 w-3 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default function AudioRoomPage({ params }: { params: Promise<{ audioRoomId: string }> }) {
    const { audioRoomId } = use(params);
    const client = useStreamVideoClient();
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const { isLoadingGroups, myGroupIds } = useTradeRoomContext();
    const { activeCall, joinRoom, isJoining } = useActiveCall();

    useEffect(() => {
        if (!client || !audioRoomId || !session?.user || isLoadingGroups) return;
        if (activeCall?.id === audioRoomId) return;

        const init = async () => {
            try {
                // Permission Check
                const call = client.call("audio_room", audioRoomId);
                await call.get();

                const custom = call.state.custom as any;
                const creatorId = call.state.createdBy?.id;
                const currentUserId = session.user.id;

                // 1. Creator always has access
                const isCreator = (creatorId === currentUserId);

                if (!isCreator && custom?.permissionType === 'group') {
                    let hasAccess = false;

                    // Check Groups
                    if (custom.allowedGroups && Array.isArray(custom.allowedGroups)) {
                        if (custom.allowedGroups.some((g: string) => myGroupIds.includes(g))) hasAccess = true;
                    }

                    // Check Users
                    if (!hasAccess) {
                        let allowedIds: any[] = [];
                        if (Array.isArray(custom.allowedUserIds)) allowedIds = custom.allowedUserIds;
                        else if (typeof custom.allowedUserIds === 'string') {
                            try { allowedIds = JSON.parse(custom.allowedUserIds); } catch (e) { }
                        }

                        if (allowedIds.some((id: any) => String(id).trim() === String(currentUserId).trim())) {
                            hasAccess = true;
                        }
                    }

                    if (!hasAccess) {
                        toast.error("You do not have permission to join this room");
                        router.push('/trade-room');
                        return;
                    }
                }

                await joinRoom(audioRoomId);
            } catch (error) {
                console.error("Failed to join room", error);
                toast.error("Failed to join room");
                router.push("/trade-room");
            }
        }
        init();

    }, [client, audioRoomId, session?.user, isLoadingGroups, activeCall, joinRoom, myGroupIds, router]);

    if (!session || !client || isJoining || !activeCall || activeCall.id !== audioRoomId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black flex-col gap-4 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p>{isJoining ? "Joining Audio Room..." : "Loading..."}</p>
            </div>
        );
    }

    return (
        <StreamTheme className="h-screen w-full bg-black text-white">
            <div className="fixed inset-0 z-50 bg-background">
                <ActiveRoom call={activeCall} />
            </div>
        </StreamTheme>
    );
}

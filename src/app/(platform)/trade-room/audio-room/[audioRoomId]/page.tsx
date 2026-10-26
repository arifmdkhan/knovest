"use client";

import { use, useEffect, useState, useMemo, useRef } from "react";
import { useStreamVideoClient, Call, StreamTheme, StreamCall, useCallStateHooks, ParticipantView, StreamVideoParticipant, useCall } from "@stream-io/video-react-sdk";
import { loadRoomCall } from "@/lib/load-room-call";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/components/NavigationProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Mic, MicOff, Users, Hand, LogOut, Settings, ChevronDown, Check, ChevronLeft, ChevronRight, Radio, Share2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KnovestLogo } from "@/components/KnovestLogo";
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
import { useMediaDevices } from "@/hooks/use-media-devices";

// Main Room Content
const ActiveRoom = ({ call }: { call: Call }) => {
    const router = useRouter();
    const { useParticipants, useCallState, useLocalParticipant } = useCallStateHooks();
    const rawParticipants = useParticipants();
    const localParticipant = useLocalParticipant();
    const { backstage, members } = useCallState();
    const { leaveRoom } = useActiveCall();

    const bodyRef = useRef<HTMLDivElement>(null);
    const [pageSize, setPageSize] = useState({ speakers: 4, audience: 4 });
    useEffect(() => {
        const body = bodyRef.current;
        if (!body) return;
        const observer = new ResizeObserver(([entry]) => {
            const mobile = window.innerWidth < 768;
            const short = window.innerHeight < 650;
            const available = Math.max(0, entry.contentRect.height - 120);
            setPageSize({
                speakers: Math.min(6, Math.max(1, Math.floor(available / (short ? 96 : 138))) * (mobile ? 2 : 3)),
                audience: Math.min(8, Math.max(1, Math.floor(available / 50))),
            });
        });
        observer.observe(body);
        return () => observer.disconnect();
    }, []);
    const [speakerPage, setSpeakerPage] = useState(0);
    const [audiencePage, setAudiencePage] = useState(0);
    const [activePanel, setActivePanel] = useState("speakers");
    const [isBroadcastBusy, setBroadcastBusy] = useState(false);
    const [hasMedia, setHasMedia] = useState(false);
    useEffect(() => {
        setHasMedia(typeof navigator !== 'undefined' && !!navigator.mediaDevices);
    }, []);

    const [isBackstage, setIsBackstage] = useState(backstage);
    const [showSettings, setShowSettings] = useState(false);
    const [latestReactions, setLatestReactions] = useState<Record<string, { emoji: string; type: string }>>({});
    const [raisedHands, setRaisedHands] = useState<string[]>([]);



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

        const unique = new Map<string, StreamVideoParticipant>();
        rawParticipants.forEach(p => {
            if (!unique.has(p.userId)) {
                unique.set(p.userId, p);
            } else {
                const current = unique.get(p.userId)!;
                // Compare join times to keep the latest session
                const currentJoined = current.joinedAt ? new Date(String(current.joinedAt)).getTime() : 0;
                const newJoined = p.joinedAt ? new Date(String(p.joinedAt)).getTime() : 0;

                if (newJoined > currentJoined) {
                    unique.set(p.userId, p);
                } else if (!currentJoined && !newJoined) {
                    // Fallback to track presence if no timestamps
                    const currentActive = current.publishedTracks.length > 0;
                    const newActive = p.publishedTracks.length > 0;
                    if (!currentActive && newActive) {
                        unique.set(p.userId, p);
                    }
                }
            }
        });
        return Array.from(unique.values());
    }, [rawParticipants]);

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
            const reaction = (event as any).reaction;
            const user = reaction?.user || (event as any).user;

            if (user && reaction) {
               
                const emoji = reaction.emoji || reaction.custom?.emoji;
                if (!emoji) return;
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
            const { user, permissions } = event as any; 
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
    const getMainRole = (p: StreamVideoParticipant | undefined) => {
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

    const speakers = participants.filter(p => getMainRole(p) !== "user");
    const audience = participants.filter(p => getMainRole(p) === "user");
    const speakerPages = Math.max(1, Math.ceil(speakers.length / pageSize.speakers));
    const audiencePages = Math.max(1, Math.ceil(audience.length / pageSize.audience));
    const currentSpeakerPage = Math.min(speakerPage, speakerPages - 1);
    const currentAudiencePage = Math.min(audiencePage, audiencePages - 1);

    return <div className="audio-studio">
        <header className="room-header">
            <KnovestLogo className="size-8" />
            <div className="room-heading"><h1 title={customData.title}>{customData.title || "Audio discussion"}</h1><p>Listen, learn and share your perspective</p></div>
            <span className="room-status" data-live={!isBackstage}><Radio size={13} />{isBackstage ? "Backstage" : "Live audio"}</span>
            <span className="room-attendance"><Users size={15} />{participants.length}</span>
            <ThemeToggle />
        </header>
        <div className="audio-panel-tabs" role="tablist" aria-label="Room participants">
            <button role="tab" id="speakers-tab" aria-controls="audio-speakers" aria-selected={activePanel === "speakers"} onClick={() => setActivePanel("speakers")}>Speakers · {speakers.length}</button>
            <button role="tab" id="audience-tab" aria-controls="audio-audience" aria-selected={activePanel === "audience"} onClick={() => setActivePanel("audience")}>Audience · {audience.length}</button>
        </div>
        <div ref={bodyRef} className="audio-room-body" data-panel={activePanel}>
            <section className="audio-speaker-panel" id="audio-speakers" aria-label="Speakers and host">
                <div className="audio-panel-heading"><div><h2><Mic size={16} />Speakers & host</h2><p>{isBackstage ? "The host is preparing the room" : "The conversation is happening here"}</p></div><span>{speakers.length}</span></div>
                <div className="audio-speaker-grid">
                    {speakers.slice(currentSpeakerPage * pageSize.speakers, (currentSpeakerPage + 1) * pageSize.speakers).map(p => <SpeakerMenu key={p.sessionId} participant={p} isHost={isHost}>
                        <button className="audio-speaker-card" aria-label={`${p.name || "Participant"}, ${getMainRole(p)}. Participant options`}><AudioParticipant participant={p} reaction={latestReactions[p.userId]} role={getMainRole(p)} /></button>
                    </SpeakerMenu>)}
                    {speakers.length === 0 && <div className="audio-empty"><span className="room-empty-icon"><Mic /></span><h3>Waiting for the conversation</h3><p>Speakers will appear here when they join.</p></div>}
                </div>
                <div className="audio-panel-footer"><span>Microphones start muted</span>{speakerPages > 1 && <div className="audio-pagination">
                    <Button variant="ghost" size="icon" aria-label="Previous speakers" disabled={currentSpeakerPage === 0} onClick={() => setSpeakerPage(currentSpeakerPage - 1)}><ChevronLeft size={16} /></Button>
                    <span>{currentSpeakerPage + 1} / {speakerPages}</span>
                    <Button variant="ghost" size="icon" aria-label="Next speakers" disabled={currentSpeakerPage + 1 >= speakerPages} onClick={() => setSpeakerPage(currentSpeakerPage + 1)}><ChevronRight size={16} /></Button>
                </div>}</div>
            </section>
            <section className="audio-audience-panel" id="audio-audience" aria-label="Audience">
                <div className="audio-panel-heading"><div><h2><Users size={16} />Audience</h2><p>Raise your hand to request the mic</p></div><span>{audience.length}</span></div>
                <div className="audio-audience-list">
                    {audience.slice(currentAudiencePage * pageSize.audience, (currentAudiencePage + 1) * pageSize.audience).map(p => <ParticipantMenu key={p.sessionId} participant={p} isHost={isHost}>
                        <button className="audio-audience-person" aria-label={`${p.name || "Listener"}. Participant options`}>
                            <Avatar className="size-9 shrink-0"><AvatarImage src={p.image} /><AvatarFallback>{p.name?.charAt(0) || "L"}</AvatarFallback></Avatar>
                            <span>{p.name || "Listener"}</span>
                            {raisedHands.includes(p.userId) && <Hand className="size-4 text-primary" />}
                            {latestReactions[p.userId] && <span className="audio-person-reaction">{latestReactions[p.userId].emoji}</span>}
                        </button>
                    </ParticipantMenu>)}
                    {audience.length === 0 && <div className="audio-empty"><span className="room-empty-icon"><Users /></span><h3>Make room for new voices</h3><p>Listeners will appear here as they join.</p></div>}
                </div>
                {audiencePages > 1 && <div className="audio-panel-footer audio-pagination"><Button variant="ghost" size="icon" aria-label="Previous listeners" disabled={currentAudiencePage === 0} onClick={() => setAudiencePage(currentAudiencePage - 1)}><ChevronLeft size={16} /></Button><span>{currentAudiencePage + 1} / {audiencePages}</span><Button variant="ghost" size="icon" aria-label="Next listeners" disabled={currentAudiencePage + 1 >= audiencePages} onClick={() => setAudiencePage(currentAudiencePage + 1)}><ChevronRight size={16} /></Button></div>}
            </section>
        </div>
        <footer className="room-toolbar audio-toolbar">
            <Button variant="outline" size="icon" aria-label="Audio settings" onClick={() => setShowSettings(true)}><Settings size={18} /></Button>
            <Button variant="outline" size="icon" aria-label="Copy room link" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Room link copied")).catch(() => toast.error("Unable to copy the link"))}><Share2 size={18} /></Button>
            <ReactionControls />
            {hasMedia && getMainRole(localParticipant) !== "user" && <MicControl />}
            {getMainRole(localParticipant) === "user" && <Button variant="outline" onClick={requestMicrophone}><Hand size={17} />Raise hand</Button>}
            <Button variant="destructive" size="icon" aria-label="Leave audio room" onClick={handleLeaveRoom}><LogOut size={17} /></Button>
            {isHost && <Button className="room-broadcast-button" variant={isBackstage ? "default" : "destructive"} disabled={isBroadcastBusy} onClick={async () => {
                setBroadcastBusy(true);
                try { await (isBackstage ? handleGoLive() : handleEndSession()); } finally { setBroadcastBusy(false); }
            }}>{isBroadcastBusy && <Loader2 className="size-4 animate-spin" />}{isBackstage ? "Go live" : "End session"}</Button>}
        </footer>
        <DeviceSettings open={showSettings} onOpenChange={setShowSettings} />
        <div className="absolute size-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
            {participants.map(p => <ParticipantView key={p.sessionId} participant={p} trackType="none" ParticipantViewUI={null} />)}
        </div>
    </div>;

};

const MicControl = () => {
    const call = useCall();
    const { useMicrophoneState } = useCallStateHooks();
    const { status: micStatus } = useMicrophoneState();
    const { audioInputs: audioDevices, refreshDevices, requestPermissions } = useMediaDevices({ audioOnly: true });

    const toggleMic = async () => {
        if (!call) return;
        try {
            await call.microphone.toggle();
        } catch (err) {
            console.error("Failed to toggle microphone", err);
            toast.error("Microphone toggle failed");
        }
    }

    if (!call) return null;

    return (
        <div className="flex items-center rounded-full bg-zinc-200/50 dark:bg-white/10 p-0.5 border border-border dark:border-white/5">
            <Button
                size="sm"
                variant={micStatus === 'enabled' ? "secondary" : "destructive"}
                className={cn("rounded-l-full rounded-r-none h-9 pl-3 pr-2 transition-colors border-r border-border dark:border-black/10",
                    micStatus === 'enabled' ? "bg-white dark:bg-zinc-200 text-zinc-900 hover:bg-zinc-100" : "bg-red-600 text-white hover:bg-red-700")}
                aria-label={micStatus === "enabled" ? "Mute microphone" : "Unmute microphone"}
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
                            micStatus === 'enabled' ? "bg-white dark:bg-zinc-200 text-zinc-900 hover:bg-zinc-100" : "bg-red-600 text-white hover:bg-red-700")}
                        aria-label="Select microphone"
                        onClick={() => refreshDevices()}
                    >
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1 bg-background border-border text-foreground shadow-2xl z-50" align="end" side="top">
                    <div className="text-[10px] font-bold text-muted-foreground px-2 py-2 uppercase tracking-widest">Microphone Input</div>
                    <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
                        {audioDevices.length === 0 && (
                            <div className="p-2 space-y-2">
                                <div className="text-center text-sm text-muted-foreground italic">No devices found</div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-7 border-border hover:bg-muted"
                                    onClick={() => requestPermissions()}
                                >
                                    Check Permissions
                                </Button>
                            </div>
                        )}
                        {audioDevices.map(d => (
                            <button
                                key={d.deviceId}
                                onClick={async () => {
                                    try { await call.microphone.select(d.deviceId); toast.success(`Microphone set to ${d.label}`); }
                                    catch (e) { toast.error("Failed to select device"); }
                                }}
                                className={cn("flex items-center justify-between text-sm px-2 py-2 rounded hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors w-full text-left",
                                    call.microphone.state.selectedDevice === d.deviceId ? "text-violet-600 dark:text-violet-400 bg-violet-500/10" : "text-muted-foreground")}
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

    const [isWaitingForHost, setIsWaitingForHost] = useState(false);

    useEffect(() => {
        if (!client || !audioRoomId || !session?.user || isLoadingGroups) return;
        if (activeCall?.id === audioRoomId) return;

        const init = async () => {
            try {
                // Permission Check
                const call = client.call("audio_room", audioRoomId);
                await loadRoomCall(call);
                if (call.state.endedAt) {
                    toast.info("This audio room has ended.");
                    router.push("/trade-room");
                    return;
                }

                const custom = (call.state.custom || {}) as CustomCallData;
                const creatorId = call.state.createdBy?.id;
                const currentUserId = session.user.id;

                // Creator always has access
                const isCreator = (creatorId === currentUserId);

                if (!isCreator && custom?.permissionType === 'group') {
                    let hasAccess = false;

                    // Check Groups
                    if (custom.allowedGroups && Array.isArray(custom.allowedGroups)) {
                        if (custom.allowedGroups.some((g: string) => myGroupIds.includes(g))) hasAccess = true;
                    }

                    // Check Users
                    if (!hasAccess) {
                        let allowedIds: string[] = [];
                        if (Array.isArray(custom.allowedUserIds)) allowedIds = custom.allowedUserIds.map(String);
                        else if (typeof custom.allowedUserIds === 'string') {
                            try { allowedIds = (JSON.parse(custom.allowedUserIds) as any[]).map(String); } catch (e) { }
                        }

                        if (allowedIds.some((id) => id.trim() === String(currentUserId).trim())) {
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
                setIsWaitingForHost(false); 
            } catch (error: any) {
                console.error("Failed to join room", error);

                if (error?.code === 17) {
                    setIsWaitingForHost(true);
                    return;
                }

                toast.error("Failed to join room");
                router.push("/trade-room");
            }
        }
        init();

    }, [client, audioRoomId, session?.user, isLoadingGroups, activeCall, joinRoom, myGroupIds, router]);

    if (!session || !client || isJoining || !activeCall || activeCall.id !== audioRoomId) {
        if (isWaitingForHost) {
            return (
                <div className="flex h-full w-full items-center justify-center bg-background dark:bg-black flex-col gap-6 text-foreground dark:text-white p-6 text-center transition-colors duration-500">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-violet-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative bg-card dark:bg-zinc-900 p-6 rounded-full border border-violet-500/30 shadow-xl shadow-violet-500/10">
                            <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
                        </div>
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h2 className="text-2xl font-bold">Room hasn&apos;t started yet</h2>
                        <p className="text-muted-foreground">The host is currently backstage or hasn&apos;t started the session. Please wait or try again later.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => window.location.reload()} className="border-border hover:bg-muted">
                            Retry
                        </Button>
                        <Button onClick={() => router.push('/trade-room')} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
                            Go Back
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex h-full w-full items-center justify-center bg-background dark:bg-black flex-col gap-4 text-foreground dark:text-white transition-colors duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p>{isJoining ? "Joining Audio Room..." : "Loading..."}</p>
            </div>
        );
    }

    return (
        <StreamTheme className="room-theme audio-room-theme">
            <StreamCall call={activeCall}>
                <div className="h-full min-h-0 overflow-hidden bg-background">
                    <ActiveRoom call={activeCall} />
                </div>
            </StreamCall>
        </StreamTheme>
    );
}

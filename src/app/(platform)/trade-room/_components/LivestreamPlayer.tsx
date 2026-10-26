"use client";

import { Call, StreamCall, StreamTheme, hasScreenShare, useCallStateHooks, ParticipantView } from "@stream-io/video-react-sdk";
import { useEffect, useMemo, useState } from "react";
import { useChatContext, Channel, MessageList, MessageInput, Window } from "stream-chat-react";
import type { Channel as ChatChannel } from "stream-chat";
import { ManageAccessDialog } from "./ManageAccessDialog";
import { RoomParticipantView } from "./RoomParticipantView";
import { StreamControls } from "./StreamControls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MediaDeviceSettings } from "./MediaDeviceSettings";
import { Loader2, MessageSquare, X, Share2, Shield, Settings2, MoreHorizontal, Users, Radio, MonitorUp, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnovestLogo } from "@/components/KnovestLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useRouter } from "@/components/NavigationProvider";
import { CustomCallData } from "@/types/stream";

export function LivestreamPlayer({ call }: { call: Call }) {
    return <StreamCall call={call}><LivestreamContent call={call} /></StreamCall>;
}

function EmptyChat() {
    return <div className="room-chat-empty">
        <span className="room-empty-icon"><MessageSquare size={24} /></span>
        <h3>Join the conversation</h3>
        <p>Share a question or an insight with the room.</p>
    </div>;
}

function LivestreamContent({ call }: { call: Call }) {
    const router = useRouter();
    const { client: chatClient } = useChatContext();
    const [chatChannel, setChatChannel] = useState<ChatChannel | null>(null);
    const [chatError, setChatError] = useState(false);
    const [chatRetry, setChatRetry] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [showManageAccess, setShowManageAccess] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [busy, setBusy] = useState(false);
    const [participantPage, setParticipantPage] = useState(0);
    const [compactStage, setCompactStage] = useState(false);
    const [ended, setEnded] = useState(false);
    const { useCallState, useParticipants, useScreenShareState } = useCallStateHooks();
    const { backstage } = useCallState();
    const participants = useParticipants();
    const { status: screenStatus } = useScreenShareState();
    const customData = (call.state.custom || {}) as CustomCallData;
    const isCreator = call.state.createdBy?.id === chatClient?.userID;

    useEffect(() => {
        setShowChat(window.matchMedia("(min-width: 1024px)").matches);
        const query = window.matchMedia("(max-width: 600px)");
        const update = () => setCompactStage(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    const uniqueParticipants = useMemo(() => {
        const grouped = new Map<string, typeof participants[number]>();
        for (const participant of participants) {
            const current = grouped.get(participant.userId);
            if (!current || (!(current.videoStream || current.audioStream) && (participant.videoStream || participant.audioStream))) {
                grouped.set(participant.userId, participant);
            }
        }
        return [...grouped.values()];
    }, [participants]);

    const screenPresenter = uniqueParticipants.find(hasScreenShare);
    const focusedParticipant = screenPresenter || uniqueParticipants.find(participant => !!participant.pin);
    const pageSize = focusedParticipant ? (compactStage ? 2 : 4) : 6;
    const pageCount = Math.max(1, Math.ceil(uniqueParticipants.length / pageSize));
    const page = Math.min(participantPage, pageCount - 1);
    const visibleParticipants = uniqueParticipants.slice(page * pageSize, (page + 1) * pageSize);
    const visibleIds = new Set(visibleParticipants.map(participant => participant.sessionId));
    const offPageParticipants = uniqueParticipants.filter(participant => !visibleIds.has(participant.sessionId) && participant.sessionId !== focusedParticipant?.sessionId);

    useEffect(() => {
        const onEnded = () => setEnded(true);
        call.on("call.ended", onEnded);
        return () => { call.off("call.ended", onEnded); };
    }, [call]);

    useEffect(() => {
        if (!chatClient || !call.id) return;
        let active = true;
        const channel = chatClient.channel("livestream", call.id);
        setChatError(false);
        setChatChannel(null);
        const watching = channel.watch();
        watching.then(() => { if (active) setChatChannel(channel); }).catch(() => { if (active) setChatError(true); });
        return () => {
            active = false;
            watching.then(() => channel.stopWatching()).catch(() => {});
        };
    }, [chatClient, call.id, chatRetry]);

    const leave = async () => {
        try { await call.leave(); router.push("/trade-room"); }
        catch { toast.error("Unable to leave. Please try again."); }
    };

    const changeBroadcast = async () => {
        if (busy) return;
        setBusy(true);
        try {
            if (backstage) { await call.goLive(); toast.success("You are now live"); }
            else { await call.stopLive(); await call.endCall(); setEnded(true); }
        } catch { toast.error("Unable to update the broadcast. Please try again."); }
        finally { setBusy(false); }
    };

    if (ended) return <div className="room-finished">
        <span className="room-empty-icon"><Video /></span>
        <h1>This stream has ended</h1><p>Thanks for being part of the conversation.</p>
        <Button onClick={() => router.push("/trade-room")}>Back to Trade Room</Button>
    </div>;

    return <StreamTheme className="room-theme">
        <div className="stream-room">
            <header className="room-header">
                <KnovestLogo className="size-8" />
                <div className="room-heading"><h1 title={customData.title}>{customData.title || "Live session"}</h1>
                    <p>{isCreator ? "Your broadcast studio" : "Knovest Trade Room"}</p>
                </div>
                <span className="room-status" data-live={!backstage}><Radio size={13} />{backstage ? "Backstage" : "Live"}</span>
                <span className="room-attendance" aria-label={`${uniqueParticipants.length} participants`}><Users size={15} />{uniqueParticipants.length}</span>
                <ThemeToggle />
            </header>

            <div className="room-body" data-chat={showChat}>
                <section className="room-stage" aria-label="Video stage">
                    {backstage && !isCreator ? <div className="room-stage-placeholder"><Radio size={32} />
                        <h2>The session starts soon</h2><p>The host is getting ready. You can join the chat while you wait.</p>
                    </div> : uniqueParticipants.length === 0 ? <div className="room-stage-placeholder"><Video size={32} />
                        <h2>Waiting for participants</h2><p>Participant tiles will appear here as people join.</p>
                    </div> : <div className="room-stage-layout" data-sharing={!!focusedParticipant}>
                        <div className={focusedParticipant ? "room-sharing-layout" : "room-presenter-grid"} data-count={visibleParticipants.length}>
                            {focusedParticipant && <RoomParticipantView participant={focusedParticipant} trackType={screenPresenter ? "screenShareTrack" : "videoTrack"} className="room-shared-screen room-presenter-video" />}
                            <div className={focusedParticipant ? "room-sharing-participants" : "room-grid-contents"}>
                                {visibleParticipants.map(participant => <RoomParticipantView key={participant.sessionId} participant={participant} muteAudio={participant.sessionId === focusedParticipant?.sessionId} className="room-presenter-video" />)}
                            </div>
                        </div>
                        {pageCount > 1 && <nav className="room-stage-pagination" aria-label="Participant pages">
                            <Button variant="ghost" size="icon" aria-label="Previous participants" disabled={page === 0} onClick={() => setParticipantPage(page - 1)}><ChevronLeft size={16} /></Button>
                            <span>Participants {page * pageSize + 1}–{Math.min((page + 1) * pageSize, uniqueParticipants.length)} of {uniqueParticipants.length}</span>
                            <Button variant="ghost" size="icon" aria-label="Next participants" disabled={page + 1 >= pageCount} onClick={() => setParticipantPage(page + 1)}><ChevronRight size={16} /></Button>
                        </nav>}
                    </div>}
                    <div className="hidden" aria-hidden="true">{offPageParticipants.map(participant => <ParticipantView key={participant.sessionId} participant={participant} trackType="none" ParticipantViewUI={null} />)}</div>
                    {backstage && isCreator && <div className="room-stage-note"><span />You are backstage. Check your devices, then go live.</div>}
                </section>

                {showChat && <aside className="room-chat" aria-label="Live chat">
                    <div className="room-chat-header"><div><h2><MessageSquare size={17} />Live chat</h2><p>A space for questions and ideas</p></div>
                        <Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setShowChat(false)}><X size={18} /></Button>
                    </div>
                    <div className="room-chat-content">
                        {chatChannel ? <Channel channel={chatChannel} EmptyStateIndicator={EmptyChat}>
                            <Window>
                                <MessageList disableDateSeparator hideDeletedMessages messageActions={["react", "reply"]} />
                                <MessageInput maxRows={3} additionalTextareaProps={{ placeholder: "Share a message…" }} />
                            </Window>
                        </Channel> : <div className="room-chat-empty" role="status">
                            {chatError ? <><MessageSquare size={24} /><h3>Chat could not connect</h3><Button variant="outline" onClick={() => setChatRetry(value => value + 1)}>Retry chat</Button></> : <><Loader2 className="animate-spin" /><p>Connecting to chat…</p></>}
                        </div>}
                    </div>
                </aside>}
            </div>

            <footer className="room-toolbar">
                <div className="room-device-controls"><StreamControls call={call} onLeave={leave} /></div>
                <div className="room-toolbar-actions">
                    {isCreator && <Button variant="outline" size="icon" aria-label={screenStatus === "enabled" ? "Stop sharing screen" : "Share screen"} aria-pressed={screenStatus === "enabled"} onClick={() => call.screenShare.toggle().catch(() => toast.error("Screen sharing was not started."))}><MonitorUp size={18} /></Button>}
                    <Button variant={showChat ? "default" : "outline"} size="icon" aria-label="Toggle live chat" aria-expanded={showChat} onClick={() => setShowChat(value => !value)}><MessageSquare size={18} /></Button>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="More session options"><MoreHorizontal size={19} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setShowSettings(true)}><Settings2 />Device settings</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => { navigator.clipboard.writeText(window.location.href).then(() => toast.success("Stream link copied")).catch(() => toast.error("Unable to copy the link")); }}><Share2 />Copy invite link</DropdownMenuItem>
                            {isCreator && <DropdownMenuItem onSelect={() => setShowManageAccess(true)}><Shield />Manage access</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {isCreator && <Button className="room-broadcast-button" variant={backstage ? "default" : "destructive"} disabled={busy} onClick={changeBroadcast}>{busy && <Loader2 className="size-4 animate-spin" />}{backstage ? "Go live" : "End stream"}</Button>}
            </footer>
        </div>
        <ManageAccessDialog open={showManageAccess} onOpenChange={setShowManageAccess} call={call} />
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Device settings</DialogTitle><DialogDescription>Choose your microphone, camera and speakers.</DialogDescription></DialogHeader><MediaDeviceSettings /></DialogContent>
        </Dialog>
    </StreamTheme>;
}

"use client";

import { useEffect, useState } from "react";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Link, Edit, Globe, Lock, Mic, Headphones } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { deleteStream } from "@/features/media/actions/stream.action";
import { CreateAudioRoomDialog } from "./CreateAudioRoomDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { useTradeRoomContext } from "./TradeRoomContext";

import { useRoomHosts } from "./useRoomHosts";
import { openRoomTab } from "@/lib/open-room-tab";

interface AudioRoomListProps {
    type: "live" | "upcoming" | "my-rooms";
    initialData?: Call[];
}



export function AudioRoomList({ type, initialData }: AudioRoomListProps) {
    const client = useStreamVideoClient();
    const { data: session } = authClient.useSession();
    const [calls, setCalls] = useState<Call[]>(initialData || []);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [editingCall, setEditingCall] = useState<Call | null>(null);

    const { client: chatClient } = useChatContext();
    const { myGroupIds, isLoadingGroups } = useTradeRoomContext();

    const creatorsData = useRoomHosts(calls);

    useEffect(() => {
        if (!client || !chatClient || (type !== 'my-rooms' && isLoadingGroups)) return;

        const fetchCalls = async () => {
            setIsLoading(true);
            try {
                let filter_conditions: { [key: string]: any } = { type: 'audio_room' };
                let sort: { field: string; direction: number }[] = [{ field: 'starts_at', direction: -1 }];

                if (type === 'live') {
                    filter_conditions = {
                        ...filter_conditions,
                        backstage: false,
                        ended_at: { $exists: false }
                    };
                } else if (type === 'upcoming') {
                    filter_conditions = {
                        ...filter_conditions,
                        starts_at: { $exists: true }
                    };
                } else if (type === 'my-rooms') {
                    const userId = session?.user?.id;

                    if (!userId) {
                        setCalls([]);
                        setIsLoading(false);
                        return;
                    }

                    filter_conditions = {
                        type: 'audio_room',
                        created_by_user_id: userId,
                    };
                    sort = [{ field: 'created_at', direction: -1 }];
                }

                const { calls } = await client.queryCalls({
                    filter_conditions,
                    sort,
                    limit: 10,
                });

                if (type === 'my-rooms') {
                    setCalls(calls);
                } else {
                    const accessibleCalls = calls.filter(call => {
                        const custom = call.state.custom;
                        const creatorId = call.state.createdBy?.id;
                        const currentUserId = session?.user?.id;
                        const streamUserId = chatClient?.userID;

                        // Creator always has access
                        if (creatorId && (creatorId === currentUserId || creatorId === streamUserId)) return true;
                        // 'Everyone' permission
                        if (!custom || !custom.permissionType || custom.permissionType === 'everyone') return true;
                        // 'Group' permission
                        if (custom.permissionType === 'group') {
                            // Check Groups
                            const allowedGroups = custom.allowedGroups as string[] || [];
                            if (allowedGroups.some(groupId => myGroupIds.includes(groupId))) return true;
                            // Check specific users
                            let allowedUserIds: any[] = [];
                            if (Array.isArray(custom.allowedUserIds)) {
                                allowedUserIds = custom.allowedUserIds;
                            } else if (typeof custom.allowedUserIds === 'string') {
                                try { allowedUserIds = JSON.parse(custom.allowedUserIds); } catch (e) { }
                            }

                            if (Array.isArray(allowedUserIds)) {
                                const isAllowed = allowedUserIds.some((id: unknown) => {
                                    const strId = String(id).trim();
                                    return (currentUserId && strId === String(currentUserId).trim()) ||
                                        (streamUserId && strId === String(streamUserId).trim());
                                });
                                if (isAllowed) return true;
                            }
                        }
                        return false;
                    });
                    setCalls(accessibleCalls);
                }

            } catch (error: any) {
                console.error("Failed to fetch audio rooms", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCalls();
    }, [client, chatClient, type, session?.user?.id, myGroupIds, isLoadingGroups]);

    const handleDelete = async (call: Call) => {
        try {
            await deleteStream({ type: call.type, id: call.id });
            toast.success("Audio room deleted successfully");
            setCalls((prev) => prev.filter((c) => c.id !== call.id));
        } catch (error) {
            console.error("Failed to delete audio room", error);
            toast.error("Failed to delete audio room");
        }
    };

    const handleCopyLink = (callId: string) => {
        const url = `${window.location.origin}/trade-room/audio-room/${callId}`;
        navigator.clipboard.writeText(url);
        toast.success("Room link copied to clipboard");
    };

    if (isLoading) {
        return (
            <div className="session-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                    <AudioRoomCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (calls.length === 0) {
        return <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <Headphones className="size-7 text-primary" />
            <h3 className="font-semibold">{type === "my-rooms" ? "No audio rooms yet" : "No audio rooms available"}</h3>
            <p className="max-w-xs text-sm text-muted-foreground">{type === "my-rooms" ? "Your audio discussions will appear here once you create a room." : "Check back for the next conversation."}</p>
        </div>;
    }

    return (
        <>
            <div className="session-grid">
                {calls.map((call) => {
                    const isCreator = call.state.createdBy?.id === chatClient?.userID;
                    return (
                        <Card key={call.id} className="session-card group min-w-0 overflow-hidden border-zinc-200/80 bg-white hover:bg-zinc-50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-violet-500/30 dark:hover:bg-zinc-900 dark:hover:shadow-2xl dark:hover:shadow-violet-900/20 transition-all duration-300 p-0 gap-2.5 h-full flex flex-col">
                            {/* Visual Header */}
                            <div className="h-40 bg-linear-to-br from-violet-500/5 to-purple-500/5 dark:from-violet-950/20 dark:to-purple-900/10 relative flex items-center justify-center border-b border-border/40 overflow-hidden">
                                {/* Animated Background Pattern */}
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.07] group-hover:opacity-[0.06] group-hover:scale-105 transition-all duration-700 ease-out"></div>

                                {/* Pulsing Icon Visualization */}
                                <div className="relative z-10 group-hover:scale-110 transition-transform duration-300">
                                    <div className="absolute -inset-6 bg-violet-500/10 rounded-full blur-2xl animate-pulse"></div>
                                    <div className="h-16 w-16 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg ring-1 ring-white/20 dark:ring-white/10 group-hover:shadow-violet-500/20 transition-shadow">
                                        <Mic className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                    </div>
                                </div>

                                {/* Viewer Count Overlay */}
                                <div className="absolute top-3 right-3 z-20">
                                    <div className="bg-black/60 text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm border border-white/10">
                                        <Headphones className="h-3 w-3" />
                                        {call.state.participantCount}
                                    </div>
                                </div>

                                {/* Permission Badge */}
                                <div className="absolute top-3 left-3 z-20">
                                    <div className="bg-black/60 text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm border border-white/10">
                                        {call.state.custom?.permissionType === 'group' ? (
                                            <>
                                                <Lock className="h-3 w-3 text-amber-400" />
                                                <span className="opacity-90">Group</span>
                                            </>
                                        ) : (
                                            <>
                                                <Globe className="h-3 w-3 text-emerald-400" />
                                                <span className="opacity-90">Public</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute bottom-3 left-3 z-20">
                                    {!call.state.endedAt && !call.state.backstage ? (
                                        <div className="flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg animate-pulse">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                            LIVE
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
                                            {call.state.endedAt ? "ENDED" : "SCHEDULED"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content Section */}
                            <CardHeader className="p-4 space-y-3">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-semibold leading-tight line-clamp-1 group-hover:text-violet-500 transition-colors">
                                        {call.state.custom?.title || "Untitled Room"}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {(() => {
                                            if (call.state.endedAt) return `Ended ${formatDistanceToNow(new Date(call.state.endedAt), { addSuffix: true })}`;
                                            if (call.state.startsAt) return `Starts ${formatDistanceToNow(new Date(call.state.startsAt), { addSuffix: true })}`;
                                            return `Created ${formatDistanceToNow(new Date(call.state.createdAt || new Date()), { addSuffix: true })}`;
                                        })()}
                                    </p>
                                </div>

                                <div className="flex min-w-0 items-center justify-between pt-1">
                                    {(() => {
                                        const creatorId = (call.state.createdBy as any)?.id;
                                        const creator = (creatorId && creatorsData[creatorId]) || call.state.createdBy;

                                        return (
                                            <UserAvatarWithInfo
                                                className="min-w-0 flex-1"
                                                name={creator?.name || "Host"}
                                                username={creator?.username || creator?.custom?.username || null}
                                                image={creator?.image || null}
                                                expertVerificationType={creator?.expertVerificationType || creator?.custom?.expertVerificationType}
                                                accountVerificationType={creator?.accountVerificationType || creator?.custom?.accountVerificationType}
                                                avatarClassName="h-8 w-8 ring-2 ring-white dark:ring-zinc-800"
                                            />
                                        );
                                    })()}
                                </div>
                            </CardHeader>

                            <CardFooter className="session-card-footer p-4 pt-0 gap-2">
                                <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 border-0 h-9 text-sm" disabled={!!call.state.endedAt} onClick={() => { if (!openRoomTab(`/trade-room/audio-room/${call.id}`)) toast.error("Allow Knovest to open a new tab, then try again."); }}>
                                    {call.state.endedAt ? "Ended" : "Join Room"}
                                </Button>

                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md" onClick={() => handleCopyLink(call.id)}>
                                        <Link className="h-4 w-4" />
                                    </Button>
                                    {isCreator && (
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md" onClick={() => setEditingCall(call)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {type === 'my-rooms' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Audio Room?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently end the room and remove it. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(call)} className="bg-red-600 hover:bg-red-700">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <CreateAudioRoomDialog
                open={!!editingCall}
                onOpenChange={(open) => !open && setEditingCall(null)}
                editCall={editingCall || undefined}
            />
        </>
    );
}

//Audioroom Skeleton
function AudioRoomCardSkeleton() {
    return (
        <Card className="overflow-hidden border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="h-40 bg-zinc-100 dark:bg-zinc-900/50 relative flex items-center justify-center">
                <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <CardHeader className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col gap-1.5 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                    </div>
                </div>
            </CardHeader>
            <CardFooter className="session-card-footer p-4 pt-0 gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
            </CardFooter>
        </Card>
    );
}
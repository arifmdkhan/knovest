"use client";

import { useEffect, useState } from "react";
import { useStreamVideoClient, Call } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Link, Edit, Globe, Lock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { deleteStream } from "@/server/actions/stream";
import { CreateStreamDialog } from "./CreateStreamDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { hasUserPaidForStream } from "@/server/actions/payment-check";

import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { useTradeRoomContext } from "./TradeRoomContext";
import { CustomCallData } from "@/types/stream";

interface StreamListProps {
    type: "live" | "upcoming" | "my-streams" | "all-video";
    initialData?: Call[];
}

export function StreamCardSkeleton() {
    return (
        <Card className="overflow-hidden border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 h-full flex flex-col">
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-900/50 relative flex items-center justify-center">
                <Skeleton className="h-12 w-12 rounded-full opacity-20" />
            </div>
            <CardHeader className="p-4 space-y-3 flex-1">
                <div className="flex items-start justify-between gap-4">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-3 w-24 rounded-md" />
                        <Skeleton className="h-2 w-16 rounded-md" />
                    </div>
                </div>
            </CardHeader>
            <CardFooter className="p-4 pt-0 gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
            </CardFooter>
        </Card>
    );
}

export function StreamList({ type, initialData }: StreamListProps) {
    const client = useStreamVideoClient();
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [calls, setCalls] = useState<Call[]>(initialData || []);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [editingCall, setEditingCall] = useState<Call | null>(null);
    const [paidStreamIds, setPaidStreamIds] = useState<Set<string>>(new Set());

    const { client: chatClient } = useChatContext();
    const { myGroupIds, isLoadingGroups } = useTradeRoomContext();

    useEffect(() => {
        if (!client || !chatClient || (type !== 'my-streams' && isLoadingGroups)) return;

        const fetchCalls = async () => {
            setIsLoading(true);
            try {
                let filter_conditions: { [key: string]: any } = { type: 'livestream' };
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
                        starts_at: { $exists: true },
                        ended_at: { $exists: false }
                    };
                } else if (type === 'all-video') {
                    filter_conditions = {
                        ...filter_conditions,
                        ended_at: { $exists: false },
                        $or: [
                            { backstage: false },
                            { starts_at: { $exists: true } }
                        ]
                    };
                } else if (type === 'my-streams') {
                    const userId = session?.user?.id;
                    if (!userId) {
                        setCalls([]);
                        setIsLoading(false);
                        return;
                    }

                    filter_conditions = {
                        type: 'livestream',
                        created_by_user_id: userId,
                    };
                    sort = [{ field: 'created_at', direction: -1 }];
                }

                console.log("Fetching calls for type:", type);

                const { calls: fetchedCalls } = await client.queryCalls({
                    filter_conditions,
                    sort,
                    limit: 50,
                });

                if (type === 'my-streams') {
                    setCalls(fetchedCalls);
                } else {
                    const visibleCalls = fetchedCalls.filter(call => {
                        const custom = (call.state.custom || {}) as CustomCallData;
                        const creatorId = (call.state.createdBy as any)?.id;
                        const currentUserId = session?.user?.id;
                        const streamUserId = chatClient?.userID;

                        if (creatorId && (creatorId === currentUserId || creatorId === streamUserId)) return true;
                        if (!custom.permissionType || custom.permissionType === 'everyone') return true;

                        if (custom.permissionType === 'group') {
                            if (custom.allowedGroups && custom.allowedGroups.length > 0) {
                                if (myGroupIds.some(groupId => custom.allowedGroups?.includes(groupId))) {
                                    return true;
                                }
                            }
                            if (custom.allowedUserIds && Array.isArray(custom.allowedUserIds)) {
                                const isAllowed = custom.allowedUserIds.some((id: any) => {
                                    const strId = String(id).trim();
                                    return (currentUserId && strId === String(currentUserId).trim()) ||
                                        (streamUserId && strId === String(streamUserId).trim());
                                });
                                if (isAllowed) return true;
                            }
                        }

                        if (custom.isPaid) {
                            return true;
                        }

                        return false;
                    });

                    setCalls(visibleCalls);
                }

            } catch (error: unknown) {
                console.error("Failed to fetch calls", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCalls();
    }, [client, chatClient, type, session?.user?.id, myGroupIds, isLoadingGroups]);

    useEffect(() => {
        if (!session?.user?.id || calls.length === 0) return;

        const checkPayments = async () => {
            const paidStreams = calls.filter(c => (c.state.custom as CustomCallData)?.isPaid);
            if (paidStreams.length === 0) return;

            const newPaidSet = new Set(paidStreamIds);
            let changed = false;

            await Promise.all(paidStreams.map(async (call) => {
                if (!newPaidSet.has(call.id)) {
                    const hasPaid = await hasUserPaidForStream(call.id, session.user.id);
                    if (hasPaid) {
                        newPaidSet.add(call.id);
                        changed = true;
                    }
                }
            }));

            if (changed) {
                setPaidStreamIds(newPaidSet);
            }
        };

        checkPayments();
    }, [calls, session?.user?.id]);

    const handleDelete = async (call: Call) => {
        try {
            await deleteStream(call.type, call.id);
            toast.success("Stream deleted successfully");
            setCalls((prev) => prev.filter((c) => c.id !== call.id));
        } catch (error) {
            console.error("Failed to delete stream", error);
            toast.error("Failed to delete stream");
        }
    };

    const handleCopyLink = (callId: string) => {
        const url = `${window.location.origin}/trade-room/${callId}`;
        navigator.clipboard.writeText(url);
        toast.success("Stream link copied");
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StreamCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
                    <Play className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No streams found</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                    {type === 'my-streams'
                        ? "You haven't created any streams yet."
                        : "There are no active streams matching your criteria at the moment."}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {calls.map((call) => {
                    const isCreator = call.state.createdBy?.id === chatClient?.userID;
                    const customData = (call.state.custom || {}) as CustomCallData;

                    const isPaidStream = !!customData.isPaid;
                    const price = customData.price ? Number(customData.price) : 0;

                    const hasAccess = (() => {
                        const creatorId = (call.state.createdBy as any)?.id;
                        const userId = session?.user?.id;
                        const streamUserId = chatClient?.userID;

                        if (creatorId && (creatorId === userId || creatorId === streamUserId)) return true;
                        if ((!customData.permissionType || customData.permissionType === 'everyone') && !isPaidStream) return true;

                        if (customData.permissionType === 'group') {
                            if (customData.allowedGroups && customData.allowedGroups.length > 0) {
                                if (myGroupIds.some(groupId => customData.allowedGroups?.includes(groupId))) return true;
                            }
                            if (customData.allowedUserIds && Array.isArray(customData.allowedUserIds)) {
                                const isAllowed = customData.allowedUserIds.some((id: any) => {
                                    const strId = String(id).trim();
                                    return (userId && strId === String(userId).trim()) ||
                                        (streamUserId && strId === String(streamUserId).trim());
                                });
                                if (isAllowed) return true;
                            }
                        }

                        if (isPaidStream && paidStreamIds.has(call.id)) return true;

                        return false;
                    })();

                    const startTime = call.state.startsAt ? new Date(call.state.startsAt).getTime() :
                        (call.state.startedAt ? new Date(call.state.startedAt).getTime() :
                            (call.state.createdAt ? new Date(call.state.createdAt).getTime() : Date.now()));

                    const timeDiff = Date.now() - startTime;
                    const isWindowOpen = isPaidStream && (timeDiff <= 15 * 60 * 1000 || timeDiff < 0);

                    return (
                        <Card key={call.id} className="group overflow-hidden border-zinc-200/80 bg-white hover:bg-zinc-50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-violet-500/30 dark:hover:bg-zinc-900 dark:hover:shadow-2xl dark:hover:shadow-violet-900/20 transition-all duration-300 p-0 gap-0 h-full flex flex-col">
                            <div className="aspect-video bg-zinc-100 dark:bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 group-hover:scale-110 transition-transform duration-700 ease-out" />
                                <Play className="h-12 w-12 text-zinc-300 dark:text-zinc-800 group-hover:text-violet-500/50 transition-colors duration-300 relative z-0" />

                                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
                                    <div className="bg-black/60 text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm border border-white/10">
                                        <Users className="h-3 w-3" />
                                        {call.state.participantCount}
                                    </div>
                                    {isPaidStream && (
                                        <div className="bg-amber-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm border border-white/10 uppercase">
                                            ₹{price}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute top-3 left-3 z-10">
                                    <div className="bg-black/60 text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm border border-white/10">
                                        {customData.permissionType === 'group' ? (
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
                                        {isPaidStream && !hasAccess && (
                                            <div className="ml-1 pl-1 border-l border-white/20 flex items-center gap-1">
                                                <Lock className="h-3 w-3 text-amber-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-3 left-3 z-10">
                                    {!call.state.endedAt && !call.state.backstage ? (
                                        <div className="flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-xl animate-pulse">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                            LIVE
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-blue-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
                                            SCHEDULED
                                        </div>
                                    )}
                                </div>
                            </div>

                            <CardHeader className="p-4 space-y-3 flex-1">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-semibold leading-tight line-clamp-1 group-hover:text-violet-500 transition-colors">
                                        {customData.title || "Untitled Stream"}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                        {(() => {
                                            if (call.state.endedAt) return `Ended ${formatDistanceToNow(new Date(call.state.endedAt), { addSuffix: true })}`;
                                            if (call.state.startsAt) return `Starts ${formatDistanceToNow(new Date(call.state.startsAt), { addSuffix: true })}`;
                                            return `Created ${formatDistanceToNow(new Date(call.state.createdAt || new Date()), { addSuffix: true })}`;
                                        })()}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <UserAvatarWithInfo
                                        name={call.state.createdBy?.name || "Unknown"}
                                        username={(call.state.createdBy?.custom?.username as string) || "user"}
                                        image={call.state.createdBy?.image || null}
                                        avatarClassName="h-8 w-8 ring-2 ring-white dark:ring-zinc-800"
                                    />
                                </div>
                            </CardHeader>

                            <CardFooter className="p-4 pt-0 gap-2">
                                <Button
                                    className={`flex-1 text-white shadow-md border-0 h-9 text-sm font-medium transition-all active:scale-95 ${hasAccess ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/20" :
                                        (isWindowOpen ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20" : "bg-zinc-400 cursor-not-allowed")
                                        }`}
                                    disabled={!hasAccess && !isWindowOpen}
                                    onClick={() => {
                                        if (hasAccess) {
                                            window.open(`/trade-room/${call.id}`, '_blank');
                                        } else if (isWindowOpen) {
                                            if (customData.isPaid) {
                                                router.push(`/trade-room/payment/${call.id}`);
                                            }
                                        }
                                    }}
                                >
                                    <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                                    {hasAccess ? "Join Stream" : (
                                        isWindowOpen ? `Pay ₹${price} to Join` : "Access Closed"
                                    )}
                                </Button>

                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors" onClick={() => handleCopyLink(call.id)}>
                                        <Link className="h-4 w-4" />
                                    </Button>
                                    {isCreator && (
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors" onClick={() => setEditingCall(call)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {type === 'my-streams' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your stream.
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

            <CreateStreamDialog
                open={!!editingCall}
                onOpenChange={(open) => !open && setEditingCall(null)}
                editCall={editingCall || undefined}
            />


        </>
    );
}

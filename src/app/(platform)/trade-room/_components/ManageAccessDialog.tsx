"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Shield, Crown } from "lucide-react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";
import { Channel } from "stream-chat";
import { UserMultiSelect } from "@/components/UserMultiSelect";
import { CustomChannelData } from "@/lib/chat-types";
import { toast } from "sonner";
import { revokeStreamAccess, getStreamAccessDetails } from "@/features/media/actions/stream-access.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useInView } from "react-intersection-observer";

interface ManageAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    call: Call;
}

type AccessUser = {
    id: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
    type: "manual" | "paid" | "creator";
    isGroup?: boolean;
};

export function ManageAccessDialog({ open, onOpenChange, call }: ManageAccessDialogProps) {
    const client = useStreamVideoClient();
    const { client: chatClient } = useChatContext();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [paidMembers, setPaidMembers] = useState<AccessUser[]>([]);
    const [manualMembers, setManualMembers] = useState<AccessUser[]>([]);
    const [allowedGroups, setAllowedGroups] = useState<Channel[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);

    const { ref: loadMoreRef, inView } = useInView();

    interface CustomCallData {
        allowedUserIds?: string[] | string;
        allowedGroups?: string[];
    }
    const customData = (call.state.custom || {}) as CustomCallData;
    const manualIdsRaw = customData.allowedUserIds;

    const fetchDetails = useCallback(async (pageNum: number) => {
        setIsFetchingInfo(true);
        const manualIds: string[] = [];
        if (pageNum === 1) {
            if (Array.isArray(manualIdsRaw)) {
                manualIds.push(...manualIdsRaw.map((id: any) => String(id)));
            } else if (typeof manualIdsRaw === 'string') {
                try { manualIds.push(...JSON.parse(manualIdsRaw)); } catch { }
            }
        }

        try {
            const res = await getStreamAccessDetails(call.id, manualIds, pageNum);

            if (res.status === "success" && res.data) {
                const details = res.data;
                if (pageNum === 1) {
                    setPaidMembers(details.paidUsers as AccessUser[]);
                    setManualMembers(details.manualUsers as AccessUser[]);
                } else {
                    setPaidMembers(prev => [...prev, ...(details.paidUsers as AccessUser[])]);
                   
                }
                setHasMore(!!details.hasMorePaid);
            }
        } catch (error) {
            console.error("Error fetching access details", error);
        } finally {
            setIsFetchingInfo(false);
        }
    }, [call.id, manualIdsRaw]);

    // Initial Load
    useEffect(() => {
        if (open) {
            setPage(1);
            setHasMore(true);
            setPaidMembers([]); 
            setManualMembers([]);
            fetchDetails(1);
        }
    }, [open, fetchDetails]);

    // Load More on Scroll
    useEffect(() => {
        if (inView && hasMore && !isFetchingInfo && open) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchDetails(nextPage);
        }
    }, [inView, hasMore, isFetchingInfo, open, page, fetchDetails]);


    // Fetch Allowed Groups details 
    const groupIdsRaw = customData.allowedGroups || [];
    const groupIds = Array.isArray(groupIdsRaw) ? groupIdsRaw : [];

    useEffect(() => {
        if (!chatClient || !open || !groupIds.length) return;

        const fetchGroups = async () => {
            try {
                const filters = { type: 'messaging', id: { $in: groupIds } };
                const channels = await chatClient.queryChannels(filters, {}, { limit: 50 });
                setAllowedGroups(channels);
            } catch (error) {
                console.error("Failed to fetch groups", error);
            }
        };
        fetchGroups();
    }, [chatClient, open, JSON.stringify(groupIds)]);


    // Derive Display List
    const accessList = useMemo(() => {
        const creatorId = (call.state.createdBy as any)?.id;
        const list: AccessUser[] = [];

        // Groups
        allowedGroups.forEach(g => {
            list.push({
                id: g.id!,
                name: (g.data as CustomChannelData)?.name || g.id,
                image: (g.data as CustomChannelData)?.image as string,
                type: 'manual',
                isGroup: true
            });
        });

        // Merging Users
        // prioritize Creator > Manual > Paid
        const allUsersMap = new Map<string, AccessUser>();

        // Paid
        paidMembers.forEach(u => allUsersMap.set(u.id, u));

        // Manual (Overwrite paid if same, to show as Invited)
        manualMembers.forEach(u => allUsersMap.set(u.id, u));

        // Creator
        if (creatorId) {
            allUsersMap.set(creatorId, {
                id: creatorId,
                name: call.state.createdBy?.name || "Creator",
                image: call.state.createdBy?.image,
                type: 'creator'
            });
        }

        Array.from(allUsersMap.values()).forEach(u => {
            // Ensure Creator is marked creator even if in other lists
            if (u.id === creatorId) u.type = 'creator';
            list.push(u);
        });

        return list;
    }, [paidMembers, manualMembers, allowedGroups, call.state.createdBy]);

    const handleAddUsers = async () => {
        if (!selectedUserIds.length) return;
        setIsLoading(true);
        try {
            const currentAllowed: string[] = [];
            if (Array.isArray(manualIdsRaw)) {
                currentAllowed.push(...manualIdsRaw);
            } else if (typeof manualIdsRaw === 'string') {
                try { currentAllowed.push(...JSON.parse(manualIdsRaw)); } catch { }
            }

            const newAllowed = Array.from(new Set([...currentAllowed, ...selectedUserIds]));

            await call.update({
                custom: {
                    ...customData,
                    allowedUserIds: newAllowed
                }
            });

            toast.success("Users added successfully");
            setSelectedUserIds([]);
            // Trigger refetch or optimistic update (to be implemented properly later)
            fetchDetails(1);
        } catch (error) {
            console.error("Failed to add users", error);
            toast.error("Failed to add users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveUser = async (user: AccessUser & { isGroup?: boolean }) => {
        setIsLoading(true);
        try {
            if (user.isGroup) {
                const currentGroups: string[] = customData.allowedGroups || [];
                const newGroups = currentGroups.filter(g => g !== user.id);
                await call.update({
                    custom: {
                        ...customData,
                        allowedGroups: newGroups
                    }
                });
                toast.success("Group access revoked");
                setAllowedGroups(prev => prev.filter(g => g.id !== user.id));
                return;
            }

            if (user.type === 'manual') {
                const currentAllowed: string[] = [];
                if (Array.isArray(manualIdsRaw)) {
                    currentAllowed.push(...manualIdsRaw);
                } else if (typeof manualIdsRaw === 'string') {
                    try { currentAllowed.push(...JSON.parse(manualIdsRaw)); } catch { }
                }

                const newAllowed = currentAllowed.filter(id => id !== user.id);

                await call.update({
                    custom: {
                        ...customData,
                        allowedUserIds: newAllowed
                    }
                });
                toast.success("User access revoked");
                setManualMembers(prev => prev.filter(m => m.id !== user.id));

            } else if (user.type === 'paid') {
                const res = await revokeStreamAccess(call.id, user.id);
                if (res.status === "error") throw new Error(res.message);
                setPaidMembers(prev => prev.filter(m => m.id !== user.id));
                toast.success("Paid access revoked");
            }
        } catch (error) {
            console.error("Failed to remove user", error);
            toast.error("Failed to remove/revoke user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-violet-500" />
                        Manage Access
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 p-6 pt-2 min-h-0">
                    {/* Add Users Section */}
                    <div className="space-y-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <h4 className="text-sm font-medium text-zinc-400">Add Exception</h4>
                        <div className="flex flex-col gap-3">
                            <UserMultiSelect
                                selectedUserIds={selectedUserIds}
                                onSelectedUserIdsChange={setSelectedUserIds}
                            />
                            {selectedUserIds.length > 0 && (
                                <Button
                                    size="sm"
                                    onClick={handleAddUsers}
                                    disabled={isLoading}
                                    className="bg-violet-600 hover:bg-violet-700 text-white w-full"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Grant Access
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <h4 className="text-sm font-medium text-zinc-400 mb-3">Allowed Groups & Users ({accessList.length})</h4>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {accessList.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-zinc-800">
                                            <AvatarImage src={item.image || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-xs">{item.name?.[0] || (item.isGroup ? 'G' : 'U')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">{item.name || item.id}</p>
                                            {!item.isGroup && item.username && <p className="text-xs text-zinc-500">@{item.username}</p>}
                                            <div className="flex gap-2 mt-0.5">
                                                {item.type === 'creator' && <Badge variant="secondary" className="h-5 text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 gap-1"><Crown className="h-3 w-3" /> Creator</Badge>}

                                                {item.isGroup && <Badge variant="secondary" className="h-5 text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20 px-1.5">Group</Badge>}

                                                {!item.isGroup && item.type === 'manual' && <Badge variant="secondary" className="h-5 text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20 px-1.5">Invited</Badge>}

                                                {!item.isGroup && item.type === 'paid' && <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-1.5">Paid Pass</Badge>}
                                            </div>
                                        </div>
                                    </div>

                                    {item.type !== 'creator' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                                            onClick={() => handleRemoveUser(item)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {hasMore && (
                                <div ref={loadMoreRef} className="h-10 flex w-full items-center justify-center">
                                    {isFetchingInfo && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

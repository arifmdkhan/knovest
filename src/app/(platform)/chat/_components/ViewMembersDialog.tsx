import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Channel } from "stream-chat";
import { useChatContext } from "stream-chat-react";
import { Badge } from "@/components/ui/badge";
import { Crown, Trash2, Loader2, Shield, MoreVertical, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toggleModeratorRole } from "@/server/actions/stream";

interface ViewMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: Channel;
}

export function ViewMembersDialog({ open, onOpenChange, channel }: ViewMembersDialogProps) {
    const { client } = useChatContext();
    const [actionUserId, setActionUserId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const members = Object.values(channel.state.members);
    const creatorId = channel.data?.created_by?.id;
    const isCreator = creatorId === client.userID;

    const handleRemoveMember = async () => {
        if (!confirmRemoveId) return;

        setIsUpdating(true);
        try {
            await channel.removeMembers([confirmRemoveId]);
            toast.success("Member removed");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove member");
        } finally {
            setIsUpdating(false);
            setConfirmRemoveId(null);
        }
    };

    const handleToggleModerator = async (userId: string, isModerator: boolean) => {
        setActionUserId(userId);
        setIsUpdating(true);
        try {
            await toggleModeratorRole(channel.id!, userId, !isModerator);

            if (isModerator) {
                toast.success("Moderator privileges removed");
            } else {
                toast.success("Member promoted to moderator");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update role");
        } finally {
            setIsUpdating(false);
            setActionUserId(null);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Group Members ({members.length})</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {members.map((member) => {
                                const isMemberCreator = member.user_id === creatorId;
                                const isModerator = member.role === 'moderator';
                                const isMe = member.user_id === client.userID;
                                const canManage = isCreator && !isMemberCreator && !isMe;

                                return (
                                    <div key={member.user_id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-border/50">
                                                <AvatarImage src={member.user?.image as string} />
                                                <AvatarFallback>{member.user?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">
                                                        {member.user?.name || "Unknown User"}
                                                        {isMe && " (You)"}
                                                    </span>
                                                    {isMemberCreator && (
                                                        <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    )}
                                                    {isModerator && (
                                                        <ShieldCheck className="w-3 h-3 text-blue-500" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {member.user?.online ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isMemberCreator ? (
                                                <Badge variant="secondary" className="text-[10px]">Owner</Badge>
                                            ) : isModerator ? (
                                                <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Mod</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px]">Member</Badge>
                                            )}

                                            {canManage && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            disabled={isUpdating && actionUserId === member.user_id}
                                                        >
                                                            {isUpdating && actionUserId === member.user_id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleToggleModerator(member.user_id!, isModerator)}>
                                                            {isModerator ? (
                                                                <>
                                                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                                                    <span>Dismiss as Moderator</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    <span>Make Moderator</span>
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setConfirmRemoveId(member.user_id!)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Remove from Group</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!confirmRemoveId} onOpenChange={(open) => !open && setConfirmRemoveId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this member from the group? They will need to be re-added to join again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleRemoveMember();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

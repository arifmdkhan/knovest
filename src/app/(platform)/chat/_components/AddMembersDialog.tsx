"use client";

import { useState } from "react";
import { Channel } from "stream-chat";
import { CustomChannelData } from "@/lib/chat-types";
import { useChatContext } from "stream-chat-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { searchUsers } from "@/server/actions/user";
import { addMembersToChannel } from "@/server/actions/stream";

interface AddMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: Channel;
}

type SearchedUser = {
    id: string;
    name: string;
    username: string;
    image: string | null;
    expertVerificationType: string | null;
    accountVerificationType: string | null;
};

export function AddMembersDialog({ open, onOpenChange, channel }: AddMembersDialogProps) {
    const { client } = useChatContext();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchedUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const existingMembers = Object.keys(channel.state.members);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const result = await searchUsers(val);
            if (result.status === "success" && result.data) {
                const data = result.data as unknown as SearchedUser[];
                const newUsers = data.filter((u) => !existingMembers.includes(u.id));
                setResults(newUsers);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleUser = (id: string) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    const addMembers = async () => {
        if (selectedUsers.length === 0) return;
        setIsAdding(true);

        try {
            const result = await addMembersToChannel(channel.id!, selectedUsers);
            if (result.status === "error") throw new Error(result.message);

            toast.success("Members added successfully");
            onOpenChange(false);
            setSelectedUsers([]);
            setQuery("");
            setResults([]);
        } catch (e) {
            console.error(e);
            toast.error("Failed to add members");
        } finally {
            setIsAdding(false);
        }
    };

    const isGroup = (channel.data?.member_count || 0) > 2 || !!(channel.data as CustomChannelData)?.name;
    const isCreator = channel.data?.created_by?.id === client.userID;

    if (isGroup && !isCreator) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Add People</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center text-muted-foreground">
                        <p>Only the group creator can add members.</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Add People</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or username..."
                            className="pl-9"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <div className="h-60 overflow-y-auto space-y-1 border rounded-md p-1">
                        {isSearching ? (
                            <div className="flex justify-center p-8 text-muted-foreground">
                                <Loader2 className="animate-spin h-5 w-5" />
                            </div>
                        ) : results.length === 0 && query.length >= 2 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                <p>No users found</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                <UserPlus className="h-8 w-8 mb-2 opacity-20" />
                                <p>Search to add members</p>
                            </div>
                        ) : (
                            results.map(user => (
                                <div
                                    key={user.id}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedUsers.includes(user.id) ? "bg-primary/10" : "hover:bg-muted"
                                        }`}
                                    onClick={() => toggleUser(user.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-border/50">
                                            <AvatarImage src={user.image || ""} />
                                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-medium leading-none">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                                        </div>
                                    </div>
                                    {selectedUsers.includes(user.id) && (
                                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={addMembers} disabled={isAdding || selectedUsers.length === 0}>
                            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
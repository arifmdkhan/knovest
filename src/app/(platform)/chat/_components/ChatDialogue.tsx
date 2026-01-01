"use client";

import { useState, useEffect } from "react";
import { useChatContext } from "stream-chat-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Search, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { searchUsers } from "@/features/user/user.action";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function CreateChatDialog({ open, onOpenChange, canCreateGroup }: { open: boolean, onOpenChange: (o: boolean) => void, canCreateGroup: boolean }) {
    const { client } = useChatContext();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Group specific state
    const [groupName, setGroupName] = useState("");
    const [mode, setMode] = useState<"direct" | "group">("direct");

    // Ensure mode is reset if permission changes or dialog opens
    useEffect(() => {
        if (!canCreateGroup && mode === "group") {
            setMode("direct");
        }
    }, [canCreateGroup, mode]);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        try {
            // The instruction implies passing 'query' as an object property.
            // Assuming 'debouncedSearch' is intended to be 'val' for this specific change,
            // or that 'debouncedSearch' would be defined elsewhere.
            // For faithfulness to the instruction's snippet, we use 'val' as the query value.
            const result = await searchUsers({ query: val });
            if (result.status === "success" && result.data) {
                setResults(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleUser = (id: string) => {
        if (mode === "direct") {
            setSelectedUsers(prev => prev.includes(id) ? [] : [id]);
        } else {
            setSelectedUsers(prev =>
                prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
            );
        }
    };

    const createChannel = async () => {
        if (selectedUsers.length === 0 && (!canCreateGroup || mode !== "group")) return;
        if (mode === "group" && !groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        setIsCreating(true);

        try {
            let channel;

            if (mode === "direct") {
                // Create a distinct DM with a deterministic ID
                const targetUserId = selectedUsers[0];

                if (!targetUserId) {
                    toast.error("Please select a user");
                    setIsCreating(false);
                    return;
                }

                // Sort members to ensure the ID is the same regardless of who creates it
                const members = [client.userID!, targetUserId].sort();

                // Use shared helper for consistency
                const { getDmChannelId } = await import("@/lib/chat-utils");
                const channelId = await getDmChannelId(client.userID!, targetUserId);

                channel = client.channel('messaging', channelId, {
                    members: members,
                });
            } else {
                // Create a named Group
                const channelId = `${groupName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

                channel = client.channel('messaging', channelId, {
                    name: groupName,
                    members: [client.userID!, ...selectedUsers],
                    created_by_id: client.userID,
                    demo: "app",
                } as any);
            }

            await channel.watch();
            toast.success(mode === "direct" ? "Chat started" : "Group created");
            router.push(`/chat/${channel.id}`);
            onOpenChange(false);

            // Reset state
            setSelectedUsers([]);
            setQuery("");
            setGroupName("");
            setResults([]);
        } catch (e) {
            console.error(e);
            toast.error("Failed to create chat");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="direct" value={mode} onValueChange={(v) => { setMode(v as any); setSelectedUsers([]); }}>
                    <TabsList className={`grid w-full ${canCreateGroup ? "grid-cols-2" : "grid-cols-1"}`}>
                        <TabsTrigger value="direct">Direct Message</TabsTrigger>
                        {canCreateGroup && <TabsTrigger value="group">New Group</TabsTrigger>}
                    </TabsList>

                    <div className="py-4 space-y-4">
                        {mode === "group" && (
                            <div className="space-y-2">
                                <Label>Group Name</Label>
                                <Input
                                    placeholder="Enter group name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Select Members</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-9"
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="h-[200px] overflow-y-auto space-y-1 border rounded-md p-1">
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
                                    <User className="h-8 w-8 mb-2 opacity-20" />
                                    <p>Search to add people</p>
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
                                                <AvatarImage src={user.image} />
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
                            <Button onClick={createChannel} disabled={isCreating || (selectedUsers.length === 0 && (!canCreateGroup || mode !== "group"))}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === "direct" ? "Start Chat" : "Create Group"}
                            </Button>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
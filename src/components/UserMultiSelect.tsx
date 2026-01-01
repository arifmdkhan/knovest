"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { useChatContext } from "stream-chat-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchUsers } from "@/features/user/user.action";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserMultiSelectProps {
    selectedUserIds: string[];
    onSelectedUserIdsChange: (ids: string[]) => void;
}

interface UserResult {
    id: string;
    name?: string;
    image?: string;
    username?: string;
}

export function UserMultiSelect({ selectedUserIds, onSelectedUserIdsChange }: UserMultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [debouncedQuery] = useDebounce(query, 300);
    const [users, setUsers] = React.useState<UserResult[]>([]);
    const [selectedUsers, setSelectedUsers] = React.useState<UserResult[]>([]);
    const [loading, setLoading] = React.useState(false);

    const { client } = useChatContext();

    // Fetch initial selected users details if IDs exist but details don't
    React.useEffect(() => {
        if (selectedUserIds.length > 0 && selectedUsers.length === 0 && client) {
            const fetchSelected = async () => {
                try {
                    const response = await client.queryUsers({ id: { $in: selectedUserIds } });
                    setSelectedUsers(response.users.map(u => ({
                        id: u.id,
                        name: u.name,
                        image: u.image,
                        username: (u as any).username || (u as any).custom?.username
                    })));
                } catch (error) {
                    console.error("Failed to fetch selected users", error);
                }
            };
            fetchSelected();
        }
    }, [selectedUserIds, client, selectedUsers.length]);

    // Search users
    React.useEffect(() => {
        if (!debouncedQuery) {
            setUsers([]);
            return;
        }

        const performSearch = async () => {
            setLoading(true);
            try {
                // Use server action for reliable user search (Postgres)
                // This ensures we get username, verification badges, etc. correctly
                const result = await searchUsers({ query: debouncedQuery });

                if (result.status === "success" && result.data) {
                    setUsers(result.data.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        image: u.image || undefined,
                        username: u.username || undefined
                    })));
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error("Failed to search users", error);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]); // Removed client dependency as we don't use it for search anymore

    const handleSelect = (user: UserResult) => {
        if (selectedUserIds.includes(user.id)) return;

        const newIds = [...selectedUserIds, user.id];
        const newUsers = [...selectedUsers, user];

        onSelectedUserIdsChange(newIds);
        setSelectedUsers(newUsers);
        setOpen(false);
        setQuery("");
    };

    const handleRemove = (userId: string) => {
        const newIds = selectedUserIds.filter(id => id !== userId);
        const newUsers = selectedUsers.filter(u => u.id !== userId);

        onSelectedUserIdsChange(newIds);
        setSelectedUsers(newUsers);
    };

    return (
        <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <span className="text-muted-foreground">Search and add users...</span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}> {/* We stick to server-side filtering */}
                        <CommandInput
                            placeholder="Search users by name or username..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {loading && <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>}
                            {!loading && query && users.length === 0 && (
                                <CommandEmpty>No users found.</CommandEmpty>
                            )}
                            {!loading && users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => handleSelect(user)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="relative">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.image} />
                                                <AvatarFallback>{user.name?.charAt(0) || "?"}</AvatarFallback>
                                            </Avatar>
                                            {selectedUserIds.includes(user.id) && (
                                                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name || "Unknown User"}</span>
                                            <span className="text-xs text-muted-foreground">@{user.username || user.id}</span>
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected Users Badges */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in-50">
                    {selectedUsers.map((user) => (
                        <Badge
                            key={user.id}
                            variant="secondary"
                            className="bg-zinc-100 dark:bg-zinc-800 text-sm py-1 pl-1 pr-2 gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={user.image} />
                                <AvatarFallback className="text-[10px]">{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            <button
                                onClick={() => handleRemove(user.id)}
                                className="ml-1 rounded-full p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

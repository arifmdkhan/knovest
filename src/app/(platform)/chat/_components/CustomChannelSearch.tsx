"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/server/actions/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatContext } from "stream-chat-react";
import { useRouter } from "next/navigation";
import { getDmChannelId } from "@/lib/chat-utils";
import { useDebounce } from "use-debounce";

type SearchedUser = {
    id: string;
    name: string;
    username: string;
    image: string | null;
};

export function CustomChannelSearch() {
    const { client } = useChatContext();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [debouncedQuery] = useDebounce(query, 300);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const result = await searchUsers(debouncedQuery);
                if (result.status === "success" && result.data) {
                    const filtered = result.data.filter((u) => u.id !== client.userID);
                    setResults(filtered as SearchedUser[]);
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

        if (isOpen) {
            performSearch();
        }
    }, [debouncedQuery, client.userID, isOpen]);

    const handleSelectUser = async (user: SearchedUser) => {
        try {
            const channelId = await getDmChannelId(client.userID!, user.id);
            const channel = client.channel('messaging', channelId, {
                members: [client.userID!, user.id],
            });
            await channel.watch();
            setQuery("");
            setIsOpen(false);
            router.push(`/chat/${channelId}`);
        } catch (error) {
            console.error("Failed to open chat", error);
        }
    };

    return (
        <div className="px-3 pb-3 relative z-50" ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search people..."
                    className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && (query.length >= 2 || results.length > 0 || isSearching) && (
                <div className="absolute top-full left-3 right-3 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 dark:bg-zinc-900 overflow-hidden">
                    {isSearching ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-muted-foreground text-sm">
                            <p>No users found</p>
                        </div>
                    ) : (
                        results.map((user) => (
                            <button
                                key={user.id}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-accent/50 transition-colors text-left"
                                onClick={() => handleSelectUser(user)}
                            >
                                <Avatar className="h-8 w-8 border border-border/50">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate text-foreground">{user.name}</span>
                                    <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

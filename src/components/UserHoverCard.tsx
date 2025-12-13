'use client';

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle, UserPlus, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/server/actions/user";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserHoverCardProps {
    username: string;
    children: React.ReactNode;
}

// Define the type based on the return of getUserProfile which calls getProfileByUsername
// We'll trust the shape for now or define a partial interface
interface UserProfileData {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    bio: string | null;
    createdAt: Date;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isVerified: boolean;
    isSebiVerified: boolean;
}

export function UserHoverCard({ username, children }: UserHoverCardProps) {
    const [data, setData] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && !data && !isLoading) {
            setIsLoading(true);
            getUserProfile(username)
                .then((profile) => {
                    if (profile) {
                        // @ts-ignore - casting the response to match our interface for now
                        setData(profile as UserProfileData);
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, username, data, isLoading]);

    const joinDate = data?.createdAt ? new Date(data.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    }) : "";

    return (
        <HoverCard openDelay={200} onOpenChange={setIsOpen}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                        <div className="h-16 bg-muted animate-pulse rounded" />
                    </div>
                ) : data ? (
                    <div className="flex justify-between space-x-4">
                        <div className="space-y-1 w-full">
                            <div className="flex justify-between items-start">
                                <Avatar className="h-12 w-12 border border-border/50">
                                    <AvatarImage src={data.image || ""} />
                                    <AvatarFallback>{data.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex gap-2">
                                    <Button size="sm" variant={data.isFollowing ? "outline" : "default"} className={cn("h-8 rounded-full px-4 font-medium transition-all text-xs", data.isFollowing ? "text-muted-foreground w-24" : "w-20")}>
                                        {data.isFollowing ? "Following" : "Follow"}
                                    </Button>
                                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="pt-2">
                                <h4 className="text-sm font-semibold">{data.name}</h4>
                                <p className="text-xs text-muted-foreground">@{data.username}</p>
                            </div>

                            {data.bio && (
                                <p className="text-xs text-muted-foreground pt-1 line-clamp-3">
                                    {data.bio}
                                </p>
                            )}

                            <div className="flex items-center gap-4 pt-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                                    <span className="font-semibold text-foreground">{data.followingCount}</span> Following
                                </div>
                                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                                    <span className="font-semibold text-foreground">{data.followersCount}</span> Followers
                                </div>
                            </div>

                            <div className="flex items-center pt-2">
                                <CalendarDays className="mr-2 h-3.5 w-3.5 opacity-70" />{" "}
                                <span className="text-xs text-muted-foreground">
                                    Joined {joinDate}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">Could not load profile</div>
                )}
            </HoverCardContent>
        </HoverCard>
    );
}

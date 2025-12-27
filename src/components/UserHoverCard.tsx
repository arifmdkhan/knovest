'use client';

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle, UserPlus, Check, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile, toggleFollow } from "@/server/actions/user";
import { createDM } from "@/server/actions/stream";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

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
    expertVerificationType: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
    accountVerificationType: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
}

export function UserHoverCard({ username, children }: UserHoverCardProps) {
    const [data, setData] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // New state for interactivity
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isMessaging, setIsMessaging] = useState(false);

    useEffect(() => {
        if (isOpen && !data && !isLoading) {
            setIsLoading(true);
            getUserProfile(username)
                .then((res) => {
                    if (res?.status === "success" && res.data) {
                        // @ts-ignore
                        const profileData = res.data as UserProfileData;
                        setData(profileData);
                        setIsFollowing(profileData.isFollowing);
                        setFollowersCount(profileData.followersCount);
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, username, data, isLoading]);

    const handleFollow = async () => {
        if (!session) {
            toast.error("Please login to follow users");
            return;
        }
        if (isActionLoading || !data) return;

        const prevFollowing = isFollowing;
        const prevCount = followersCount;

        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        setIsActionLoading(true);

        try {
            const res = await toggleFollow(data.id);
            if (res.status === "error") throw new Error(res.message);

            if (res.data) {
                setIsFollowing(res.data.isFollowing);
                setFollowersCount(res.data.followersCount);
            }
            toast.success(res.message);
        } catch (error: any) {
            setIsFollowing(prevFollowing);
            setFollowersCount(prevCount);
            toast.error(error.message || "Failed to follow");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleMessage = async () => {
        if (!session) {
            toast.error("Please login to message users");
            return;
        }
        if (!data) return;

        setIsMessaging(true);
        try {
            const res = await createDM(data.id);
            if (res.status === "success" && res.data) {
                router.push(`/chat/${res.data}`);
            } else {
                toast.error(res.message || "Failed to start chat");
            }
        } catch (error) {
            toast.error("Failed to start chat");
        } finally {
            setIsMessaging(false);
        }
    };

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
                                    {session?.user?.id !== data.id && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={handleFollow}
                                                disabled={isActionLoading}
                                                variant={isFollowing ? "outline" : "default"}
                                                className={cn("h-8 rounded-full px-4 font-medium transition-all text-xs",
                                                    isFollowing ? "text-muted-foreground w-24" : "w-20"
                                                )}
                                            >
                                                {isFollowing ? "Following" : "Follow"}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 rounded-full"
                                                onClick={handleMessage}
                                                disabled={isMessaging}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm font-semibold">{data.name}</h4>
                                    {data.accountVerificationType === "VERIFIED_USER" && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                                    )}
                                    {data.accountVerificationType === "OFFICIAL" && (
                                        <ShieldCheck className="w-4 h-4 text-yellow-500 fill-yellow-500/10" />
                                    )}

                                    {data.expertVerificationType === "SEBI" && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1 h-5 px-1.5 text-[10px]">
                                            <ShieldCheck className="w-3 h-3" /> SEBI RA
                                        </Badge>
                                    )}
                                    {data.expertVerificationType === "CERTIFIED" && (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 h-5 px-1.5 text-[10px]">
                                            PRO
                                        </Badge>
                                    )}
                                    {data.expertVerificationType === "TRACK_RECORD" && (
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 h-5 px-1.5 text-[10px]">
                                            TRADER
                                        </Badge>
                                    )}
                                </div>
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
                                    <span className="font-semibold text-foreground">{followersCount}</span> Followers
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

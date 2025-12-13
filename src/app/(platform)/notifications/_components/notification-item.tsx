"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { UserAvatarWithInfo } from "@/components/UserAvatarWithInfo";
import { Heart, UserPlus, MessageCircle, Info, AtSign, Repeat } from "lucide-react";
import { ConsensusLogo } from "@/components/consensus-logo";

interface Actor {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
}

interface NotificationItemProps {
    notification: {
        id: string;
        type: string;
        message: string | null;
        isRead: boolean;
        createdAt: Date;
        actor?: Actor | null;
        actors?: Actor[]; // New prop for aggregated
        count?: number;   // New prop for aggregated
        entityId: string | null;
    };
    onMarkRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
    const { type, actor, actors, count, createdAt, isRead, message, entityId } = notification;

    // Use actors array if available, otherwise fallback to single actor
    const allActors = actors && actors.length > 0 ? actors : (actor ? [actor] : []);
    const displayCount = count || 1;

    const Icon = () => {
        switch (type) {
            case "LIKE": return <Heart className="w-4 h-4 text-red-500 fill-current" />;
            case "FOLLOW": return <UserPlus className="w-4 h-4 text-blue-500" />;
            case "COMMENT": return <MessageCircle className="w-4 h-4 text-green-500" />;
            case "REPLY": return <MessageCircle className="w-4 h-4 text-green-500" />;
            case "MENTION": return <AtSign className="w-4 h-4 text-orange-500" />;
            case "REPOST": return <Repeat className="w-4 h-4 text-green-500" />;
            case "SYSTEM": return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Info className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getLink = () => {
        // If multiple actors, linking to one profile is ambiguous, but usually we link to the first one or the entity
        if (type === "FOLLOW" && allActors[0]?.username) return `/profile/${allActors[0].username}`;
        if (type === "LIKE" || type === "COMMENT" || type === "REPLY" || type === "MENTION" || type === "REPOST") {
            return `/posts/${entityId}`;
        }
        return "#";
    };

    const generateText = () => {
        const actionText = {
            "LIKE": "liked your post",
            "FOLLOW": "started following you",
            "COMMENT": "commented on your post",
            "REPLY": "replied to your comment",
            "MENTION": "mentioned you",
            "REPOST": "reposted your post",
            "SYSTEM": "System Notification"
        }[type] || "sent a notification";

        if (type === "SYSTEM") return <span className="font-semibold text-foreground/90">System</span>;

        if (displayCount === 1) {
            return <span className="font-semibold text-foreground/90">{allActors[0]?.name || "Someone"}</span>;
        } else if (displayCount === 2) {
            return (
                <span>
                    <span className="font-semibold text-foreground/90">{allActors[0]?.name}</span>
                    {" and "}
                    <span className="font-semibold text-foreground/90">{allActors[1]?.name || "1 other"}</span>
                </span>
            );
        } else {
            return (
                <span>
                    <span className="font-semibold text-foreground/90">{allActors[0]?.name}</span>
                    {", "}
                    <span className="font-semibold text-foreground/90">{allActors[1]?.name}</span>
                    {" and "}
                    <span className="font-semibold text-foreground/90">{displayCount - 2} others</span>
                </span>
            );
        }
    };

    if (type === "SYSTEM") {
        return (
            <div
                className={cn(
                    "relative flex items-start gap-4 p-4 border-b hover:bg-muted/50 transition-colors",
                    !isRead && "bg-primary/5 hover:bg-primary/10"
                )}
                onClick={() => !isRead && onMarkRead?.(notification.id)}
            >
                <div className="shrink-0 relative mt-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ConsensusLogo className="w-6 h-6" />
                    </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-foreground font-medium leading-snug">
                        {message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </p>
                </div>
                {!isRead && (
                    <div className="absolute top-4 right-4">
                        <span className="block w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative flex items-start gap-4 p-4 border-b hover:bg-muted/50 transition-colors",
                !isRead && "bg-primary/5 hover:bg-primary/10"
            )}
            onClick={() => !isRead && onMarkRead?.(notification.id)}
        >
            {/* Actor Avatar(s) */}
            <div className="shrink-0 relative">
                {displayCount > 1 ? (
                    <div className="flex -space-x-3 overflow-hidden">
                        {allActors.slice(0, 2).map((a, i) => (
                            <div key={a.id || i} className={cn("relative z-10 border-2 border-background rounded-full", i === 0 && "z-20")}>
                                <UserAvatarWithInfo
                                    name={a.name}
                                    username={a.username || "unknown"}
                                    image={a.image}
                                    className="w-10 h-10"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <UserAvatarWithInfo
                        name={allActors[0]?.name || "System"}
                        username={allActors[0]?.username || "system"}
                        image={allActors[0]?.image}
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <Link href={getLink()} className="block group">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Icon />
                        <span className="text-sm font-medium text-muted-foreground">
                            {type === "LIKE" && "liked your post"}
                            {type === "FOLLOW" && "started following you"}
                            {type === "COMMENT" && "commented on your post"}
                            {type === "REPLY" && "replied to your comment"}
                            {type === "MENTION" && "mentioned you"}
                            {type === "REPOST" && "reposted your post"}
                            {type === "SYSTEM" && "System Notification"}
                        </span>
                    </div>
                    <p className="text-sm text-foreground leading-snug">
                        {generateText()}
                        {message && <span className="text-muted-foreground ml-1">"{message}"</span>}
                    </p>
                </Link>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
            </div>

            {/* Action (Optional Read Indicator) */}
            {!isRead && (
                <div className="absolute top-4 right-4">
                    <span className="block w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                </div>
            )}
        </div>
    );
}

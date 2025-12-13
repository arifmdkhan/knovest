import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserHoverCard } from "./UserHoverCard";

interface UserAvatarWithInfoProps {
    name: string | null;
    username: string | null;
    image: string | null;
    isVerified?: boolean;
    isSebiVerified?: boolean;
    className?: string;
    avatarClassName?: string;
    children?: React.ReactNode;
}

import { memo } from "react";

// ... imports

// ... interface

export const UserAvatarWithInfo = memo(function UserAvatarWithInfo({
    name,
    username,
    image,
    isVerified,
    isSebiVerified,
    className,
    avatarClassName,
    children,
}: UserAvatarWithInfoProps) {
    const displayName = name || "Unknown";
    const displayUsername = username || "unknown";

    return (
        <UserHoverCard username={displayUsername}>
            <Link href={`/profile/${displayUsername}`} className={cn("flex gap-3 group", className)}>
                <Avatar className={cn("w-10 h-10 border border-border/50", avatarClassName)}>
                    <AvatarImage src={image || ""} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="font-semibold text-sm group-hover:underline decoration-primary underline-offset-2 truncate">
                            {displayName}
                        </span>

                        {/* --- BADGES --- */}
                        {(isVerified || isSebiVerified) && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                        )}
                        {isSebiVerified && (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 rounded-[4px] bg-green-500/10 text-[7px] font-bold text-green-600 border-blue-500 flex items-center gap-0.5"
                            >
                                <ShieldCheck className="w-1.5 h-1.5" /> SEBI RA
                            </Badge>
                        )}



                    </div>
                    <span className="text-muted-foreground text-xs">@{displayUsername}</span>
                    {children}
                </div>
            </Link>
        </UserHoverCard>
    );
});

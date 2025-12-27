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
    expertVerificationType?: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
    accountVerificationType?: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
    className?: string;
    avatarClassName?: string;
    children?: React.ReactNode;
}

import { memo } from "react";
import { Award, TrendingUp, BadgeCheck } from "lucide-react";

// ... imports

// ... interface

export const UserAvatarWithInfo = memo(function UserAvatarWithInfo({
    name,
    username,
    image,
    expertVerificationType,
    accountVerificationType,
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

                        {/* --- ACCOUNT VERIFICATION --- */}
                        {accountVerificationType === "VERIFIED_USER" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                        )}
                        {accountVerificationType === "OFFICIAL" && (
                            <BadgeCheck className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/10" /> // Gold check
                        )}

                        {/* --- EXPERT BADGES --- */}
                        {expertVerificationType === "SEBI" && (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 rounded-[4px] bg-green-500/10 text-[7px] font-bold text-green-600 border-green-200 flex items-center gap-0.5"
                            >
                                <ShieldCheck className="w-2.5 h-2.5" /> SEBI
                            </Badge>
                        )}
                        {expertVerificationType === "CERTIFIED" && (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 rounded-[4px] bg-blue-500/10 text-[7px] font-bold text-blue-600 border-blue-200 flex items-center gap-0.5"
                            >
                                <Award className="w-2.5 h-2.5" /> PRO
                            </Badge>
                        )}
                        {expertVerificationType === "TRACK_RECORD" && (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 rounded-[4px] bg-purple-500/10 text-[7px] font-bold text-purple-600 border-purple-200 flex items-center gap-0.5"
                            >
                                <TrendingUp className="w-2.5 h-2.5" /> TRADER
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

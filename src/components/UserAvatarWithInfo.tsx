import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "@/components/AppLink";
import { cn } from "@/lib/utils";
import { UserHoverCard } from "./UserHoverCard";
import { memo } from "react";
import { VerificationBadge } from "./ui/verification-badge";

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
    const displayUsername = username?.trim();
    if (!displayUsername) {
        return <div className={cn("flex min-w-0 items-center gap-3", className)}>
            <Avatar className={cn("size-10 shrink-0 border border-border/50", avatarClassName)}>
                <AvatarImage src={image || undefined} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{displayName}</p>{children}</div>
        </div>;
    }

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

                        {/*ACCOUNT VERIFICATION type */}
                        <VerificationBadge accountType={accountVerificationType} className="w-3.5 h-3.5" />

                        {/*EXPERT BADGES type */}
                        <VerificationBadge expertType={expertVerificationType} />



                    </div>
                    <span className="text-muted-foreground text-xs">@{displayUsername}</span>
                    {children}
                </div>
            </Link>
        </UserHoverCard>
    );
});

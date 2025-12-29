import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Award, BadgeCheck, CheckCircle2, ShieldCheck, TrendingUp } from "lucide-react";

interface VerificationBadgeProps {
    expertType?: "SEBI" | "CERTIFIED" | "TRACK_RECORD" | null;
    accountType?: "NONE" | "OFFICIAL" | "VERIFIED_USER" | null;
    showText?: boolean;
    className?: string;
    iconClassName?: string;
}

export function VerificationBadge({
    expertType,
    accountType,
    showText = true,
    className,
    iconClassName
}: VerificationBadgeProps) {
    const iconSize = iconClassName || "w-3 h-3";

    // --- EXPERT VERIFICATION ---
    if (expertType === "SEBI") {
        return (
            <Badge variant="outline" className={cn("bg-green-500/10 text-green-600 border-green-500/30 gap-1 h-5 px-1.5 text-[10px] font-bold", className)}>
                <ShieldCheck className={iconSize} />
                {showText && "SEBI RA"}
            </Badge>
        );
    }

    if (expertType === "CERTIFIED") {
        return (
            <Badge variant="outline" className={cn("bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 h-5 px-1.5 text-[10px] font-bold", className)}>
                <Award className={iconSize} />
                {showText && "PRO"}
            </Badge>
        );
    }

    if (expertType === "TRACK_RECORD") {
        return (
            <Badge variant="outline" className={cn("bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 h-5 px-1.5 text-[10px] font-bold", className)}>
                <TrendingUp className={iconSize} />
                {showText && "P&L"}
            </Badge>
        );
    }

    // --- ACCOUNT VERIFICATION ---
    if (accountType === "VERIFIED_USER") {
        return (
            <CheckCircle2 className={cn("text-blue-500 fill-blue-500/10", iconSize, className)} />
        );
    }

    if (accountType === "OFFICIAL") {
        return (
            <BadgeCheck className={cn("text-yellow-500 fill-yellow-500/10", iconSize, className)} />
        );
    }

    return null;
}

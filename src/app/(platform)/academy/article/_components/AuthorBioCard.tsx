import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, Award, TrendingUp, BadgeCheck } from "lucide-react";
import Link from "@/components/AppLink";
import { User } from "@/generated/prisma/client";
import { UserHoverCard } from "@/components/UserHoverCard";

interface AuthorBioCardProps {
    author: Pick<User, "name" | "username" | "image" | "bio" | "expertVerificationType" | "accountVerificationType">;
}

export function AuthorBioCard({ author }: AuthorBioCardProps) {
    const displayName = author.name || "Unknown Author";
    const displayUsername = author.username || "unknown";

    return (
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left transition-all hover:bg-card/50 hover:border-border/80 hover:shadow-sm">
            <UserHoverCard username={displayUsername}>
                <Link href={`/profile/${displayUsername}`} className="shrink-0 group">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                        <AvatarImage src={author.image || ""} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {displayName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </UserHoverCard>

            <div className="flex-1 space-y-3">
                <div className="space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        <UserHoverCard username={displayUsername}>
                            <Link href={`/profile/${displayUsername}`} className="hover:underline decoration-primary underline-offset-4">
                                <h3 className="text-xl font-bold text-foreground">
                                    {displayName}
                                </h3>
                            </Link>
                        </UserHoverCard>

                        {/* --- ACCOUNT VERIFICATION --- */}
                        {author.accountVerificationType === "VERIFIED_USER" && (
                            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                        )}
                        {author.accountVerificationType === "OFFICIAL" && (
                            <BadgeCheck className="w-5 h-5 text-yellow-500 fill-yellow-500/10" />
                        )}

                        {/* --- EXPERT BADGES --- */}
                        {author.expertVerificationType === "SEBI" && (
                            <Badge
                                variant="outline"
                                className="h-5 px-1.5 rounded-lg bg-green-500/10 text-[9px] font-bold text-green-600 border-green-200 flex items-center gap-1"
                            >
                                <ShieldCheck className="w-2.5 h-2.5" /> SEBI
                            </Badge>
                        )}
                        {author.expertVerificationType === "CERTIFIED" && (
                            <Badge
                                variant="outline"
                                className="h-5 px-1.5 rounded-lg bg-blue-500/10 text-[9px] font-bold text-blue-600 border-blue-200 flex items-center gap-1"
                            >
                                <Award className="w-2.5 h-2.5" /> PRO
                            </Badge>
                        )}
                        {author.expertVerificationType === "TRACK_RECORD" && (
                            <Badge
                                variant="outline"
                                className="h-5 px-1.5 rounded-lg bg-purple-500/10 text-[9px] font-bold text-purple-600 border-purple-200 flex items-center gap-1"
                            >
                                <TrendingUp className="w-2.5 h-2.5" /> TRADER
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm font-medium text-primary">@{displayUsername}</p>
                </div>

                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    {author.bio || `Content creator at Knovest. Follow ${displayName} to stay updated with their latest insights and articles.`}
                </p>

                <div className="pt-2">
                    <Link href={`/profile/${displayUsername}`}>
                        <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary/0 transition-all">
                            View Profile
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

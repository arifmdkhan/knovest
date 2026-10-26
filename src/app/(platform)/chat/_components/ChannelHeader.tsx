"use client";

import { useState } from "react";
import { useRouter } from "@/components/NavigationProvider";
import { useChatContext, useChannelStateContext } from "stream-chat-react";
import { ArrowLeft, Settings, MoreHorizontal, Users, Phone, Video, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatSettingsDialog } from "./ChatSettingsDialog";
import { Badge } from "@/components/ui/badge";
import { CustomChannelData } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

export function CustomChannelHeader({ onBackAction, isSubscriptionEnabled = false }: { onBackAction: () => void, isSubscriptionEnabled?: boolean }) {
    const { client } = useChatContext();
    const { channel } = useChannelStateContext();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);

    if (!channel || !client) return null;

    const memberCount = channel.data?.member_count || 0;
    const hasExplicitName = !!(channel.data as CustomChannelData)?.name;
    const isGroup = memberCount > 2 || hasExplicitName;
    const isSubscriptionGroup = (channel.data as any)?.isSubscriptionGroup || channel.id?.startsWith('subscription-group-');

    const getDisplayTitle = () => {
        if ((channel.data as CustomChannelData)?.name) return (channel.data as CustomChannelData).name;

        const members = Object.values(channel.state.members);
        const otherMembers = members.filter(m => m.user_id !== client.userID);

        if (otherMembers.length === 0) return "Just You";

        if (otherMembers.length === 1) return otherMembers[0].user?.name || "Unknown";

        const names = otherMembers.slice(0, 2).map(m => m.user?.name || "Unknown").join(", ");
        return `${names}${otherMembers.length > 2 ? ` +${otherMembers.length - 2}` : ""}`;
    };

    const getSubtext = () => {
        if (isGroup) return `${memberCount} members`;

        const members = Object.values(channel.state.members);
        const otherMember = members.find(m => m.user_id !== client.userID);
        if (otherMember?.user?.online) return "Online";

        if (otherMember?.user?.last_active) {
            // last active/online time to be implemented
            return "Offline";
        }

        return "";
    };

    const getDisplayImage = () => {
        if ((channel.data as CustomChannelData)?.image) return (channel.data as CustomChannelData).image;

        const members = Object.values(channel.state.members);
        const otherMembers = members.filter(m => m.user_id !== client.userID);

        if (otherMembers.length === 1) {
            return otherMembers[0].user?.image || "";
        }
        return "";
    };

    const isOnline = !isGroup && getSubtext() === "Online";
    const isCreator = channel.data?.created_by?.id === client.userID;
    const showCallButtons = !isGroup || isCreator;

    return (
        <div className="h-[72px] border-b border-border/40 flex items-center px-6 justify-between bg-background/80 backdrop-blur-md shrink-0 w-full transition-all duration-300">
            <div className="flex items-center gap-4 overflow-hidden">
                {/* Small width Back Button */}
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 shrink-0 hover:bg-muted/50 rounded-full" onClick={onBackAction}>
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Button>

                <div className="relative shrink-0">
                    <Avatar className="w-10 h-10 ring-2 ring-border/20 shadow-sm">
                        <AvatarImage src={getDisplayImage()} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{getDisplayTitle()?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-background animate-pulse" />
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base truncate text-foreground tracking-tight">
                            {getDisplayTitle()}
                        </span>
                        {isGroup && (
                            isSubscriptionGroup ? (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-medium border-yellow-500/20 flex items-center gap-1">
                                    <Crown className="w-2.5 h-2.5 fill-current" />
                                    Premium
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded-full bg-muted/50 text-muted-foreground font-normal border-border/50">Group</Badge>
                            )
                        )}
                    </div>
                    {getSubtext() && (
                        <span className={cn("text-xs truncate flex items-center gap-1.5 font-medium transition-colors", isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground/70")}>
                            {isGroup && (isSubscriptionGroup ? <Crown className="w-3 h-3 text-yellow-500 fill-current" /> : <Users className="w-3 h-3 opacity-70" />)}
                            {getSubtext()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Action Buttons */}
                {showCallButtons && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full w-9 h-9 hidden sm:flex"
                            title="Voice Call"
                            onClick={() => router.push('/trade-room')}
                        >
                            <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full w-9 h-9 hidden sm:flex"
                            title="Video Call"
                            onClick={() => router.push('/trade-room')}
                        >
                            <Video className="w-4 h-4" />
                        </Button>
                    </>
                )}

                <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-9 h-9"
                >
                    {isGroup ? <Settings className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                </Button>
            </div>

            <ChatSettingsDialog
                open={showSettings}
                onOpenChange={setShowSettings}
                channel={channel}
                isGroup={isGroup}
            />
        </div>
    );
}
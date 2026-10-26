"use client";

import { useCall, StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { Mic, LogOut } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MenuProps {
    children: React.ReactNode;
    participant: StreamVideoParticipant;
    isHost: boolean;
}

export const ParticipantMenu = ({ children, participant, isHost }: MenuProps) => {
    const call = useCall();
    if (!isHost) return <>{children}</>;

    const handleGrantSpeaker = async () => {
        if (!call) return;
        try {
            await call.updateCallMembers({
                update_members: [{ user_id: participant.userId, role: 'speaker' }]
            });
            await call.grantPermissions(participant.userId, ['send-audio', 'screenshare']);
            toast.success(`Invited ${participant.name || "user"} to speak`);
        } catch (err: unknown) {
            console.error("Failed to grant speaker permissions:", err);
            toast.error("Failed to grant permission");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="cursor-pointer outline-none">
                    {children}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border-border text-foreground shadow-xl z-50">
                <DropdownMenuLabel>{participant.name || "User Options"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGrantSpeaker} className="cursor-pointer transition-colors">
                    <Mic className="mr-2 h-4 w-4" />
                    <span>Invite to Speak</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const SpeakerMenu = ({ children, participant, isHost }: MenuProps) => {
    const call = useCall();
    const isCreator = participant.userId === call?.state.createdBy?.id;

    // Can't manage the creator/host
    if (!isHost || isCreator || !call) return <>{children}</>;

    const handleDemoteToAudience = async () => {
        if (!call) return;
        try {
            await call.revokePermissions(participant.userId, ['send-audio', 'screenshare']);
            await call.updateCallMembers({
                update_members: [{ user_id: participant.userId, role: 'user' }]
            });
            toast.success(`Moved ${participant.name || "user"} to audience`);
        } catch (err: unknown) {
            console.error("Failed to demote speaker:", err);
            toast.error("Failed to move to audience");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="cursor-pointer outline-none">
                    {children}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border-border text-foreground shadow-xl z-50">
                <DropdownMenuLabel>{participant.name || "Speaker Options"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDemoteToAudience} className="cursor-pointer text-red-500 focus:text-red-500 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Move to Audience</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

"use client";

import { Call } from "@stream-io/video-react-sdk";
import { Mic, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuProps {
    children: React.ReactNode;
    participant: any;
    call: Call;
    isHost: boolean;
}

export const ParticipantMenu = ({ children, participant, call, isHost }: MenuProps) => {
    if (!isHost) return <>{children}</>;

    const handleGrantSpeaker = async () => {
        try {
            await call.updateCallMembers({
                update_members: [{ user_id: participant.userId, role: 'speaker' }]
            });
            await call.grantPermissions(participant.userId, ['send-audio', 'screenshare']);
            toast.success(`Invited ${participant.name || "user"} to speak`);
        } catch (err) {
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
            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200 shadow-xl z-50">
                <DropdownMenuLabel>{participant.name || "User Options"}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleGrantSpeaker} className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 transition-colors">
                    <Mic className="mr-2 h-4 w-4" />
                    <span>Invite to Speak</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const SpeakerMenu = ({ children, participant, call, isHost }: MenuProps) => {
    const isCreator = participant.userId === call.state.createdBy?.id;

    // Can't manage the creator/host
    if (!isHost || isCreator) return <>{children}</>;

    const handleDemoteToAudience = async () => {
        try {
            await call.revokePermissions(participant.userId, ['send-audio', 'screenshare']);
            await call.updateCallMembers({
                update_members: [{ user_id: participant.userId, role: 'user' }]
            });
            toast.success(`Moved ${participant.name || "user"} to audience`);
        } catch (err) {
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
            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200 shadow-xl z-50">
                <DropdownMenuLabel>{participant.name || "Speaker Options"}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleDemoteToAudience} className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-red-400 focus:text-red-400 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Move to Audience</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

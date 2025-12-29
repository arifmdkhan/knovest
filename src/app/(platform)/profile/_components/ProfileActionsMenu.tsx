"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Share2, Flag } from "lucide-react";
import { ShareDialog } from "@/components/share-dialog";

interface ProfileActionsMenuProps {
    username: string;
    isCurrentUser?: boolean;
}

export function ProfileActionsMenu({ username, isCurrentUser }: ProfileActionsMenuProps) {
    const [isShareOpen, setIsShareOpen] = useState(false);

    const handleShare = () => {
        setIsShareOpen(true);
    };

    const handleReport = () => {
        // Placeholder for report logic
        console.log("Report submitted for:", username);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-background/40 hover:bg-background/80 backdrop-blur-xs border border-transparent hover:border-border/50 transition-all text-foreground/80">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Profile
                    </DropdownMenuItem>
                    {!isCurrentUser && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive cursor-pointer group">
                                <Flag className="mr-2 h-4 w-4 group-hover:fill-current" />
                                Report Account
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ShareDialog
                isOpen={isShareOpen}
                onOpenChange={setIsShareOpen}
                url={typeof window !== "undefined" ? `${window.location.origin}/profile/${username}` : ""}
                title={`Check out ${username}'s profile on Consensus`}
            />
        </>
    );
}

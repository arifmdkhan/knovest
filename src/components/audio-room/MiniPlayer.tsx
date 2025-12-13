"use client";

import { Call } from "@stream-io/video-react-sdk";
import { usePathname, useRouter } from "next/navigation";
import { Mic, MicOff, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveCall } from "../providers/ActiveCallProvider";

export const MiniPlayer = ({ call }: { call: Call }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { leaveRoom } = useActiveCall();

    // Don't show mini player if we are already on the call page
    const isOnCallPage = pathname?.includes(`/trade-room/audio-room/${call.id}`);

    if (isOnCallPage) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[100] w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-zinc-100 truncate">
                            {call.state.custom?.title || "Audio Room"}
                        </span>
                        <span className="text-xs text-zinc-400">
                            {call.state.participantCount} connected
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                        onClick={() => router.push(`/trade-room/audio-room/${call.id}`)}
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={leaveRoom}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

"use client";

import { useCallStateHooks, Call } from "@stream-io/video-react-sdk";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMediaDevices } from "@/hooks/use-media-devices";


interface StreamControlsProps {
    call: Call;
    onLeave?: () => void;
}

export function StreamControls({ call, onLeave }: StreamControlsProps) {
    const { useMicrophoneState, useCameraState } = useCallStateHooks();
    const { status: micStatus } = useMicrophoneState();
    const { status: camStatus } = useCameraState();
    const { audioInputs, videoInputs, refreshDevices, requestPermissions } = useMediaDevices();

    const toggleMic = async () => {
        if (micStatus !== "enabled" && audioInputs.length === 0) {
            await refreshDevices();
            toast.error("No microphone is available. Check the connected device and browser permissions.");
            return;
        }
        try {
            await call.microphone.toggle();
        } catch (error: any) {
            console.error("Failed to toggle microphone", error);

            if (audioInputs.length > 0) {
                try {
                    console.log("Attempting to auto-select microphone...");
                    await call.microphone.select(audioInputs[0].deviceId);
                    await call.microphone.enable();
                    toast.success(`Unmuted: ${audioInputs[0].label}`);
                    return;
                } catch (retryError) {
                    console.error("Retry failed", retryError);
                }
            }

            toast.error("Failed to toggle microphone");
        }
    };

    const toggleCam = async () => {
        if (camStatus !== "enabled" && videoInputs.length === 0) {
            await refreshDevices();
            toast.error("No camera is available. Check the connected device and browser permissions.");
            return;
        }
        try {
            await call.camera.toggle();
        } catch (error: any) {
            console.error("Failed to toggle camera", error);

            // Handle NotReadableError (Device in use or hardware error)
            if (error?.name === 'NotReadableError' || error?.message?.includes('NotReadableError')) {
                toast.error("Camera is in use by another application or tab.");
                return;
            }

            // Fallback- If no device is selected try selecting the first available one
            if (videoInputs.length > 0) {
                try {
                    console.log("Attempting to auto-select camera...");
                    await call.camera.select(videoInputs[0].deviceId);
                    await call.camera.enable();
                    toast.success(`Started camera: ${videoInputs[0].label}`);
                    return;
                } catch (retryError) {
                    console.error("Retry failed", retryError);
                }
            }

            toast.error("Failed to start camera. Please check permissions.");
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Microphone Control */}
            <div className="flex items-center rounded-full bg-zinc-800 p-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "rounded-l-full rounded-r-none h-10 w-10 hover:bg-zinc-700 transition-colors",
                        micStatus === 'disabled' && "text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20"
                    )}
                    onClick={toggleMic}
                    aria-pressed={micStatus === "enabled"}
                    aria-label={micStatus === "enabled" ? "Mute microphone" : "Unmute microphone"}
                    title={micStatus === 'enabled' ? "Mute" : "Unmute"}
                >
                    {micStatus === 'enabled' ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Select microphone"
                            className="rounded-r-full rounded-l-none h-11 w-5 px-0 hover:bg-zinc-700 transition-colors border-l border-zinc-700/50"
                            onClick={() => refreshDevices()}
                        >
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1 bg-popover border-border text-popover-foreground shadow-2xl z-50">
                        <div className="text-[10px] font-bold text-muted-foreground px-2 py-2 uppercase tracking-widest">Select Microphone</div>
                        <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {audioInputs.length === 0 && (
                                <div className="p-2 space-y-2">
                                    <div className="text-center text-sm text-muted-foreground italic">No microphones found</div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs h-7 border-input hover:bg-accent"
                                        onClick={requestPermissions}
                                    >
                                        Check Permissions
                                    </Button>
                                </div>
                            )}
                            {audioInputs.map(d => (
                                <button
                                    key={d.deviceId}
                                    onClick={async () => {
                                        try { await call.microphone.select(d.deviceId); toast.success(`Mic set to ${d.label}`); }
                                        catch { toast.error("Failed to set microphone"); }
                                    }}
                                    className={cn("flex items-center justify-between text-sm px-2 py-2 rounded hover:bg-accent transition-colors w-full text-left",
                                        call.microphone.state.selectedDevice === d.deviceId ? "text-primary bg-primary/10" : "text-muted-foreground")}
                                >
                                    <span className="truncate flex-1 pr-2">{d.label || `Mic ${d.deviceId.slice(0, 4)}...`}</span>
                                    {call.microphone.state.selectedDevice === d.deviceId && <Check className="h-3 w-3 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Camera Control */}
            <div className="flex items-center rounded-full bg-zinc-800 p-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "rounded-l-full rounded-r-none h-10 w-10 hover:bg-zinc-700 transition-colors",
                        camStatus === 'disabled' && "text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20"
                    )}
                    onClick={toggleCam}
                    aria-pressed={camStatus === "enabled"}
                    aria-label={camStatus === "enabled" ? "Stop camera" : "Start camera"}
                    title={camStatus === 'enabled' ? "Stop Video" : "Start Video"}
                >
                    {camStatus === 'enabled' ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Select camera"
                            className="rounded-r-full rounded-l-none h-11 w-5 px-0 hover:bg-zinc-700 transition-colors border-l border-zinc-700/50"
                            onClick={() => refreshDevices()}
                        >
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1 bg-popover border-border text-popover-foreground shadow-2xl z-50">
                        <div className="text-[10px] font-bold text-muted-foreground px-2 py-2 uppercase tracking-widest">Select Camera</div>
                        <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {videoInputs.length === 0 && (
                                <div className="p-2 space-y-2">
                                    <div className="text-center text-sm text-muted-foreground italic">No cameras found</div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs h-7 border-input hover:bg-accent"
                                        onClick={requestPermissions}
                                    >
                                        Check Permissions
                                    </Button>
                                </div>
                            )}
                            {videoInputs.map(d => (
                                <button
                                    key={d.deviceId}
                                    onClick={async () => {
                                        try { await call.camera.select(d.deviceId); toast.success(`Camera set to ${d.label}`); }
                                        catch { toast.error("Failed to set camera"); }
                                    }}
                                    className={cn("flex items-center justify-between text-sm px-2 py-2 rounded hover:bg-accent transition-colors w-full text-left",
                                        call.camera.state.selectedDevice === d.deviceId ? "text-primary bg-primary/10" : "text-muted-foreground")}
                                >
                                    <span className="truncate flex-1 pr-2">{d.label || `Cam ${d.deviceId.slice(0, 4)}...`}</span>
                                    {call.camera.state.selectedDevice === d.deviceId && <Check className="h-3 w-3 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Leave Button */}
            <Button
                variant="destructive"
                size="icon"
                className="rounded-full h-11 w-11 shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                onClick={onLeave}
                aria-label="Leave stream"
                title="Leave Stream"
            >
                <PhoneOff className="h-5 w-5" />
            </Button>
        </div>
    );
}

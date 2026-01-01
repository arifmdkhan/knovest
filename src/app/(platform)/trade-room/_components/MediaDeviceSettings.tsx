"use client";

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Mic, Video, Volume2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { useMediaDevices } from "@/hooks/use-media-devices";

export function MediaDeviceSettings() {
    const { useMicrophoneState, useCameraState, useSpeakerState } = useCallStateHooks();

    // SDK Hooks
    const { microphone, selectedDevice: selectedMic } = useMicrophoneState();
    const { camera, selectedDevice: selectedCam } = useCameraState();
    const { speaker, selectedDevice: selectedSpeaker } = useSpeakerState();

    // Shared Device Hook
    const {
        audioInputs,
        videoInputs,
        audioOutputs,
        isLoading,
        requestPermissions,
        refreshDevices
    } = useMediaDevices();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        refreshDevices();
    }, []);

    if (!mounted) return null;

    const hasNoLabels =
        (audioInputs.length > 0 && !audioInputs[0].label) ||
        (videoInputs.length > 0 && !videoInputs[0].label);

    const showWarning = hasNoLabels || (audioInputs.length === 0 && videoInputs.length === 0);

    return (
        <div className="space-y-6 py-2">

            {showWarning && (
                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-amber-500 mt-0.5">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-medium text-amber-500 text-sm mb-1">Permissions Required</h5>
                            <p className="text-xs text-amber-500/90 mb-3">
                                We can't see your devices yet. Please allow access to select your specific microphone or camera.
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => requestPermissions()}
                                className="w-full border-amber-500/30 bg-transparent text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 h-8 text-xs"
                            >
                                {isLoading ? "Requesting..." : "Enable Camera & Mic Access"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refreshDevices()}
                    disabled={isLoading}
                    title="Refresh Devices"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Microphone */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Mic className="h-4 w-4" />
                    <Label>Microphone</Label>
                </div>
                <Select
                    value={selectedMic || undefined}
                    onValueChange={(val) => microphone?.select(val)}
                >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-sm">
                        <SelectValue placeholder="Select Microphone" />
                    </SelectTrigger>
                    <SelectContent>
                        {audioInputs.length === 0 ? (
                            <SelectItem value="none" disabled>No microphones found</SelectItem>
                        ) : (
                            audioInputs.map((d) => (
                                <SelectItem key={d.deviceId} value={d.deviceId}>
                                    {d.label || "Unknown Microphone"}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Camera */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Video className="h-4 w-4" />
                    <Label>Camera</Label>
                </div>
                <Select
                    value={selectedCam || undefined}
                    onValueChange={(val) => camera?.select(val)}
                >
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-sm">
                        <SelectValue placeholder="Select Camera" />
                    </SelectTrigger>
                    <SelectContent>
                        {videoInputs.length === 0 ? (
                            <SelectItem value="none" disabled>No cameras found</SelectItem>
                        ) : (
                            videoInputs.map((d) => (
                                <SelectItem key={d.deviceId} value={d.deviceId}>
                                    {d.label || "Unknown Camera"}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Output */}
            {audioOutputs.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <Volume2 className="h-4 w-4" />
                        <Label>Speakers</Label>
                    </div>
                    <Select
                        value={selectedSpeaker || undefined}
                        onValueChange={(val) => speaker.select(val)}
                    >
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-sm">
                            <SelectValue placeholder="Select Speakers" />
                        </SelectTrigger>
                        <SelectContent>
                            {audioOutputs.map((d) => (
                                <SelectItem key={d.deviceId} value={d.deviceId}>
                                    {d.label || "Unknown Speaker"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}

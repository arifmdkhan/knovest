"use client";

import { useState, useEffect } from "react";
import { Call } from "@stream-io/video-react-sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaDevices } from "@/hooks/use-media-devices";

interface DeviceSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    call: Call;
}

export const DeviceSettings = ({ open, onOpenChange, call }: DeviceSettingsProps) => {
    const { audioInputs: devices, refreshDevices, requestPermissions } = useMediaDevices();
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (open) {
            refreshDevices();
            const current = call.microphone.state.selectedDevice;
            if (current) setSelectedDeviceId(current);
        }
    }, [open, call]);

    const handleDeviceChange = async (deviceId: string) => {
        try {
            await call.microphone.select(deviceId);
            setSelectedDeviceId(deviceId);
            toast.success("Microphone updated");
        } catch (e) {
            console.error("Failed to set device", e);
            toast.error("Failed to update microphone");
        }
    };

    return (
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm", open ? "flex" : "hidden")} onClick={() => onOpenChange(false)}>
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-6">Audio Settings</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Microphone Input</label>
                        <div className="space-y-2">
                            {devices.length === 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm text-zinc-500 italic">No devices found.</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs h-8 border-white/10 hover:bg-white/5 text-zinc-300"
                                        onClick={() => requestPermissions()}
                                    >
                                        Enable Microphone Access
                                    </Button>
                                </div>
                            )}
                            {devices.map((device) => (
                                <button
                                    key={device.deviceId}
                                    onClick={() => handleDeviceChange(device.deviceId)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left",
                                        selectedDeviceId === device.deviceId
                                            ? "bg-violet-500/20 border-violet-500/50 text-white"
                                            : "bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span className="truncate">{device.label || `Device ${device.deviceId.slice(0, 5)}...`}</span>
                                    {selectedDeviceId === device.deviceId && <div className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={() => onOpenChange(false)} variant="secondary" className="rounded-full px-6">Done</Button>
                </div>
            </div>
        </div>
    );
};

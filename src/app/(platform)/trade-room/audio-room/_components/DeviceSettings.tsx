"use client";

import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect } from "react";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaDevices } from "@/hooks/use-media-devices";

interface DeviceSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DeviceSettings = ({ open, onOpenChange }: DeviceSettingsProps) => {
    const call = useCall();
    const { audioInputs: devices, refreshDevices, requestPermissions } = useMediaDevices({ audioOnly: true });
    const { useMicrophoneState } = useCallStateHooks();
    const { selectedDevice } = useMicrophoneState();

    useEffect(() => {
        if (open) {
            refreshDevices();
        }
    }, [open, refreshDevices]);

    const handleDeviceChange = async (deviceId: string) => {
        if (!call) return;
        try {
            await call.microphone.select(deviceId);
            toast.success("Microphone updated");
        } catch (e) {
            console.error("Failed to set device", e);
            toast.error("Failed to update microphone");
        }
    };

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Audio settings</DialogTitle>
            <DialogDescription>Choose the microphone you want to use when speaking.</DialogDescription></DialogHeader>
            <div className="space-y-2 py-3">
                {devices.length === 0 ? <div className="space-y-3 rounded-xl border border-dashed border-border p-5 text-center">
                    <p className="text-sm text-muted-foreground">No microphones are available yet.</p>
                    <Button variant="outline" onClick={requestPermissions}>Enable microphone access</Button>
                </div> : devices.map(device => <button key={device.deviceId} onClick={() => handleDeviceChange(device.deviceId)} aria-pressed={selectedDevice === device.deviceId}
                    className={cn("flex min-h-12 w-full items-center justify-between rounded-xl border p-3 text-left text-sm", selectedDevice === device.deviceId ? "border-primary bg-primary/10" : "border-border hover:bg-muted")}>
                    <span className="truncate">{device.label || "Microphone"}</span>{selectedDevice === device.deviceId && <Check className="size-4 shrink-0 text-primary" />}
                </button>)}
            </div>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogContent>
    </Dialog>;
};

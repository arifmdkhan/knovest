import { useState, useEffect } from 'react';
import { toast } from "sonner";

export function useMediaDevices() {
    const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
    const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);

    const refreshDevices = async () => {
        setIsLoading(true);
        try {
            // Check for navigator.mediaDevices support
            if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
                setIsLoading(false);
                return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();

            const processDevices = (kind: MediaDeviceKind) => {
                return devices
                    .filter(d => d.kind === kind)
                    .filter(d => d.deviceId && d.deviceId.trim() !== "");
            };

            setAudioInputs(processDevices('audioinput'));
            setVideoInputs(processDevices('videoinput'));
            setAudioOutputs(processDevices('audiooutput'));
            setPermissionError(false);

        } catch (error) {
            console.error("Failed to enumerate devices", error);
            setPermissionError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const requestPermissions = async () => {
        try {
            setIsLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            stream.getTracks().forEach(track => track.stop());
            toast.success("Access granted");
            await refreshDevices();
        } catch (error) {
            console.error("Permission request failed", error);
            try {
                // Audio only fallback
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                await refreshDevices();
            } catch (e) {
                setPermissionError(true);
                toast.error("Could not access camera/microphone.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshDevices();
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
            return () => {
                navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
            };
        }
    }, []);

    return {
        audioInputs,
        videoInputs,
        audioOutputs,
        isLoading,
        permissionError,
        refreshDevices,
        requestPermissions
    };
}

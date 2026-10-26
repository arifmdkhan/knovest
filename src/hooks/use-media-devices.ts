import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";

export function useMediaDevices({ audioOnly = false }: { audioOnly?: boolean } = {}) {
    const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
    const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);

    const refreshDevices = useCallback(async () => {
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
    }, []);

    const requestPermissions = async () => {
        setIsLoading(true);
        try {
            if (!navigator.mediaDevices) throw new Error("Media devices unavailable");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !audioOnly });
            stream.getTracks().forEach(track => track.stop());
            toast.success(audioOnly ? "Microphone access granted" : "Device access granted");
            await refreshDevices();
        } catch {
            setPermissionError(true);
            toast.error(audioOnly ? "Microphone unavailable. Check browser permissions and your connected device." : "Device unavailable. Check camera and microphone permissions.");
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        refreshDevices();
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
            return () => {
                navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
            };
        }
    }, [refreshDevices]);

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

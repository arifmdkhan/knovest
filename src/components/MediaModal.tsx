"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    media: { url: string; type: 'IMAGE' | 'VIDEO' } | null;
}

export function MediaModal({ isOpen, onClose, media }: MediaModalProps) {
    if (!media) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[75vw] max-h-[75vh] w-[75vw] h-[75vh] p-0 border-none bg-black/90 shadow-2xl rounded-xl flex flex-col items-center justify-center outline-none overflow-hidden duration-200" showCloseButton={false}>
                <VisuallyHidden>
                    <DialogTitle>Media Viewer</DialogTitle>
                    <DialogDescription>View full size media</DialogDescription>
                </VisuallyHidden>

                <div className="relative w-full h-full flex items-center justify-center p-4">
                    {/* Close Button acting as overlay action */}
                    <button
                        aria-label="Close media viewer"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {media.type === 'IMAGE' ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={media.url}
                            alt="Full view"
                            className="w-full h-full object-contain rounded-md shadow-2xl"
                        />
                    ) : (
                        <video
                            src={media.url}
                            controls
                            autoPlay
                            className="w-full h-full rounded-md shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

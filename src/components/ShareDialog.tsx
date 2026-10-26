"use client";

import { useState } from "react";
import { Copy, Check, Twitter, Facebook, Linkedin, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface ShareDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title?: string;
}

export function ShareDialog({ isOpen, onOpenChange, url, title = "Check this out!" }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = typeof window !== "undefined" ? url : "";
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const shareLinks = [
        {
            name: "Twitter",
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: "hover:text-blue-400 hover:bg-blue-400/10",
        },
        {
            name: "Facebook",
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: "hover:text-blue-600 hover:bg-blue-600/10",
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: "hover:text-blue-700 hover:bg-blue-700/10",
        },
        {
            name: "Email",
            icon: Mail,
            href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
            color: "hover:text-red-500 hover:bg-red-500/10",
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 gap-2">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex flex-col items-center justify-center gap-2 rounded-lg py-4 transition-colors ${link.color}`}
                            >
                                <link.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{link.name}</span>
                            </a>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={shareUrl}
                                    readOnly
                                    className="h-9 font-mono text-sm"
                                />
                            </div>
                            <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
                                <span className="sr-only">Copy</span>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

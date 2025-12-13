"use client";

import { Button } from "@/components/ui/button";
import { Link2, Linkedin, Twitter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareSectionProps {
    title: string;
    slug: string;
}

export function ShareSection({ title, slug }: ShareSectionProps) {
    const [copied, setCopied] = useState(false);

    // Construct full URL (handled client side to get origin safely or fallback)
    const getShareUrl = () => {
        if (typeof window !== "undefined") {
            return `${window.location.origin}/academy/article/${slug}`;
        }
        return `https://consensus.com/academy/article/${slug}`; // Fallback domain
    };

    const handleCopy = () => {
        const url = getShareUrl();
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTwitterShare = () => {
        const url = getShareUrl();
        const text = `Check out this article: ${title}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    const handleLinkedinShare = () => {
        const url = getShareUrl();
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    };

    return (
        <div className="py-8 border-y border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h4 className="text-lg font-semibold bg-clip-text text-transparent bg-linear-to-r from-foreground to-muted-foreground">
                Share this article
            </h4>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-primary/10 hover:text-primary gap-2"
                    onClick={handleCopy}
                >
                    <Link2 className="w-4 h-4" />
                    {copied ? "Copied" : "Copy Link"}
                </Button>

                <div className="h-4 w-px bg-border/50 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]"
                    onClick={handleTwitterShare}
                    title="Share on Twitter"
                >
                    <Twitter className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                    onClick={handleLinkedinShare}
                    title="Share on LinkedIn"
                >
                    <Linkedin className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

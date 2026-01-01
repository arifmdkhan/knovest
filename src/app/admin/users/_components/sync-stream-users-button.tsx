"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { syncAllUsersToStream } from "@/features/media/actions/stream.action";
import { cn } from "@/lib/utils";

export function SyncStreamUsersButton({ className }: { className?: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSync = async () => {
        setIsLoading(true);
        try {
            toast.info("Starting Stream user sync...");
            const res = await syncAllUsersToStream({});
            if (res.status === "success") {
                toast.success(`Successfully synced ${res.data?.count} users to Stream.`);
            } else {
                toast.error(res.message || "Failed to sync users.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading}
            className={cn("gap-2", className)}
        >
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? "Syncing..." : "Sync to Stream"}
        </Button>
    );
}

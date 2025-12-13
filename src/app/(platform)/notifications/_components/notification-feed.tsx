"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead } from "@/server/actions/notifications";
import { NotificationItem } from "./notification-item";
import { Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

export function NotificationFeed() {
    const queryClient = useQueryClient();
    const { ref, inView } = useInView();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useInfiniteQuery({
        queryKey: ["notifications"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await getNotifications(pageParam as number, 15);
            if (res.status === "error") throw new Error(res.message);
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (allPages.length >= 3) return undefined; // Max 3 pages * 15 items = 45 items
            if (!lastPage.data || lastPage.data.length < 15) return undefined;
            return allPages.length + 1;
        },
        refetchInterval: 30000,
    });

    const { mutate: readMutation } = useMutation({
        mutationFn: async (id?: string) => {
            const res = await markAsRead(id);
            if (res.status === "error") throw new Error(res.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            // Optionally update badge count here if we had a global context
        },
        onError: () => {
            toast.error("Failed to mark as read");
        }
    });

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    // Handle Mark All as Read
    const handleMarkAllRead = () => {
        readMutation(undefined); // undefined means all
        toast.success("All notifications marked as read");
    }

    const handleMarkRead = (id: string) => {
        readMutation(id);
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="text-center py-20 text-red-500">
                Failed to load notifications. Please try again.
            </div>
        )
    }

    const notifications = data?.pages.flatMap(page => page.data || []) || [];

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <CheckCheck className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">You have no new notifications.</p>
            </div>
        )
    }

    return (
        <div className="space-y-0 divider-y divide-border/40">
            <div className="flex justify-end px-4 py-2 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs text-muted-foreground hover:text-primary">
                    <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark all read
                </Button>
            </div>

            <div className="flex flex-col">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={handleMarkRead}
                    />
                ))}
            </div>

            {/* Loading Indicator for Infinite Scroll */}
            <div ref={ref} className="py-8 flex justify-center">
                {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            </div>
        </div>
    );
}

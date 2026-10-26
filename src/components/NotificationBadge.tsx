"use client";

import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/features/notifications/actions/notifications.action";
import { Badge } from "@/components/ui/badge";

export function NotificationBadge() {
    const { data } = useQuery({
        queryKey: ["unread-notifications-count"],
        queryFn: async () => {
            const res = await getUnreadCount();
            return res.status === "success" ? res.data?.count : 0;
        },
        refetchInterval: 30000, // Poll every 30s
        staleTime: 10000,
    });

    const count = data ?? 0;
    if (count <= 0) return null;

    return (
        <Badge
            variant="destructive"
            role="status"
            aria-label={`${count} unread ${count === 1 ? "notification" : "notifications"}`}
            className="ml-auto h-5 min-w-5 shrink-0 justify-center rounded-full border-0 px-1.5 text-[11px] leading-none font-semibold tabular-nums group-data-[collapsible=icon]:hidden"
        >
            <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
        </Badge>
    );
}

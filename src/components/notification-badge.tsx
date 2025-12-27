"use client";

import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/server/actions/notifications";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <AnimatePresence>
            {data !== undefined && data > 0 && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="w-auto min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm border border-background"
                >
                    {data > 99 ? "99" : data}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

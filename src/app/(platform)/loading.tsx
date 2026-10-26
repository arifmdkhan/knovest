"use client";

import { usePathname } from "next/navigation";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function Loading() {
    const pathname = usePathname();
    const variant = pathname === "/chat" || pathname.startsWith("/chat/")
        ? "chat"
        : pathname === "/trade-room" || pathname.startsWith("/trade-room/")
            ? "room"
            : "page";
    return <PageSkeleton variant={variant} />;
}

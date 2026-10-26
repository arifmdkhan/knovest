"use client";

import NextLink, { useLinkStatus } from "next/link";
import { useEffect, useId, type ComponentProps } from "react";
import { useNavigationFeedback } from "@/components/NavigationProvider";

function PendingLink() {
    const { pending } = useLinkStatus();
    const id = useId();
    const { setLinkPending } = useNavigationFeedback();
    useEffect(() => {
        setLinkPending(id, pending);
        return () => setLinkPending(id, false);
    }, [id, pending, setLinkPending]);
    return <span hidden aria-hidden="true" data-link-pending={pending} />;
}

/** Native Next links retain prefetching, modifier clicks, refs and browser history. */
export default function AppLink({ children, ...props }: ComponentProps<typeof NextLink>) {
    return <NextLink {...props}>{children}<PendingLink /></NextLink>;
}

"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { useRouter as useNextRouter } from "next/navigation";

const NavigationContext = createContext<{
    startNavigation: (action: () => void) => void;
    setLinkPending: (id: string, pending: boolean) => void;
} | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isPending, startNavigation] = useTransition();
    const [pendingLinks, setPendingLinks] = useState<Set<string>>(() => new Set());
    const setLinkPending = useCallback((id: string, pending: boolean) => {
        setPendingLinks(previous => {
            if (previous.has(id) === pending) return previous;
            const next = new Set(previous);
            if (pending) next.add(id); else next.delete(id);
            return next;
        });
    }, []);
    const value = useMemo(() => ({ startNavigation, setLinkPending }), [startNavigation, setLinkPending]);

    return <NavigationContext.Provider value={value}>
        {children}
        {(isPending || pendingLinks.size > 0) && <div className="navigation-progress" role="progressbar" aria-label="Loading page">
            <span aria-hidden="true" />
        </div>}
    </NavigationContext.Provider>;
}

export function useNavigationFeedback() {
    const context = useContext(NavigationContext);
    if (!context) throw new Error("NavigationProvider is missing");
    return context;
}

/** Keep the native router API; track its transitions for button-driven navigation too. */
export function useRouter() {
    const router = useNextRouter();
    const { startNavigation } = useNavigationFeedback();
    return useMemo(() => ({
        ...router,
        push: (...args: Parameters<typeof router.push>) => startNavigation(() => router.push(...args)),
        replace: (...args: Parameters<typeof router.replace>) => startNavigation(() => router.replace(...args)),
        back: () => startNavigation(() => router.back()),
        forward: () => startNavigation(() => router.forward()),
        refresh: () => startNavigation(() => router.refresh()),
    }), [router, startNavigation]);
}

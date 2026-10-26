"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function PlatformShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isRoom = /^\/trade-room\/(?!payment(?:\/|$))(?:audio-room\/)?[^/]+\/?$/.test(pathname);

    if (isRoom) {
        return <main className="knovest-app room-shell h-dvh w-full overflow-hidden bg-background">{children}</main>;
    }

    return (
        <SidebarProvider className="knovest-app h-svh w-full overflow-hidden" style={{ "--sidebar-width": "16.5rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
                <DashboardHeader />
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="@container/main flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                        <div className="app-content flex flex-col gap-6">{children}</div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

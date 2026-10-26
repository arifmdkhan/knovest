import type { Metadata } from "next";

import { DashboardHeader } from "@/components/DashboardHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { AdminAppSidebar } from "./_components/admin-dashboard-sidebar";
import { requireAdmin } from "@/lib/permissions";
import { QueryProvider } from "@/components/providers/query-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PlatformLayout({ children }: { children: ReactNode }) {
    const session = await requireAdmin();

    return (
        <QueryProvider key={session.user.id}><SidebarProvider className="knovest-app" style={{ "--sidebar-width": "16.5rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>

            <AdminAppSidebar />

            <SidebarInset>
                <DashboardHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="app-content flex flex-col gap-6">
                            {children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider></QueryProvider>
    )
}

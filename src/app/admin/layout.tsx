import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { AdminAppSidebar } from "./_components/admin-dashboard-sidebar";
import { requireAdmin } from "@/lib/permissions";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
    await requireAdmin();

    return (
        <SidebarProvider>

            <AdminAppSidebar />

            <SidebarInset>
                <DashboardHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            {children}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
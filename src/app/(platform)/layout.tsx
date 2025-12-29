import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { requireUser } from "@/server/data/user/require-user";
import { ActiveCallProvider } from "@/components/providers/ActiveCallProvider";
import { getStreamToken } from "@/server/actions/stream";
import PlatformStreamProvider from "@/components/providers/PlatformStreamProvider";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
    const [user, res] = await Promise.all([
        requireUser(),
        getStreamToken()
    ]);
    const token = res.status === "success" && res.data ? res.data : "";

    return (
        <PlatformStreamProvider user={user} streamToken={token}>
            <ActiveCallProvider>
                <SidebarProvider className="h-svh w-full overflow-hidden">
                    <AppSidebar />
                    <SidebarInset className="overflow-hidden">
                        <DashboardHeader />
                        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
                            <div className="@container/main flex flex-1 flex-col gap-2 overflow-y-auto min-h-0">
                                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </ActiveCallProvider>
        </PlatformStreamProvider>
    );
}
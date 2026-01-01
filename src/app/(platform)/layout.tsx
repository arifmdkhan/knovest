import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { requireUser } from "@/features/user/queries/require-user";
import { ActiveCallProvider } from "@/components/providers/ActiveCallProvider";
import { getStreamToken } from "@/features/media/actions/stream.action";
import GlobalVideoProvider from "@/components/providers/GlobalVideoProvider";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
    const [user, res] = await Promise.all([
        requireUser(),
        getStreamToken({})
    ]);
    const token = res.status === "success" && res.data ? res.data : "";

    return (
        <GlobalVideoProvider user={user} streamToken={token}>
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
        </GlobalVideoProvider>
    );
}
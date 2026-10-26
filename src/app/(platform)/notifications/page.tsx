import { AppHero } from "@/components/AppHero";
import { Suspense } from "react";
import { NotificationFeed } from "./_components/NotificationFeed";
import { Loader2, Bell } from "lucide-react";
import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
    title: "Notifications",
    description: "View your latest notifications",
});

export default function NotificationsPage() {
    return (
        <div className="w-full space-y-7 pb-10">
            <AppHero title={<span className="flex items-center gap-3"><Bell className="size-8 text-primary" />Notifications</span>} description="Stay in the loop with your community and the latest on Knovest." />

            <div className="mt-2">
                <Suspense fallback={
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                }>
                    <NotificationFeed />
                </Suspense>
            </div>
        </div>
    );
}

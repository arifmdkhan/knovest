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
        <div className="container max-w-2xl mx-auto min-h-screen pb-20">
            <div className="flex items-center gap-3 px-4 py-6 border-b border-border/40">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Bell className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            </div>

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

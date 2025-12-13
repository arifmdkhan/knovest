import { Skeleton } from "@/components/ui/skeleton";
import { ChatSkeleton } from "./ChatSkeleton";

export function ChatLoading() {
    return (
        <div className="flex h-full w-full bg-background relative overflow-hidden rounded-lg border border-border">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex flex-col w-80 lg:w-96 border-r border-border bg-card">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-border flex justify-between items-center h-16 shrink-0 bg-card/50 backdrop-blur-sm">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>

                {/* Sidebar List */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-8" />
                                </div>
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area Skeleton */}
            <div className="flex-1 flex flex-col bg-background">
                <ChatSkeleton />
            </div>
        </div>
    );
}

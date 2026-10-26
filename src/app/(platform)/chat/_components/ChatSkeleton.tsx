import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
    return (
        <div className="flex h-full w-full flex-col bg-background">
            {/* Header Skeleton */}
            <div className="h-[72px] border-b border-border/40 flex items-center px-6 justify-between bg-background/80 backdrop-blur-md shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <div className="flex gap-1">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <Skeleton className="w-9 h-9 rounded-full" />
                </div>
            </div>

            {/* Message List Skeleton */}
            <div className="flex-1 p-4 flex flex-col gap-6 overflow-hidden pt-6">
                <div className="flex items-end gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0 mb-1" />
                    <div className="flex flex-col gap-1 max-w-[70%]">
                        <Skeleton className="h-10 w-48 rounded-[18px] rounded-bl-sm" />
                    </div>
                </div>

                <div className="flex items-end gap-2.5 flex-row-reverse self-end w-full">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0 mb-1" />
                    <div className="flex flex-col gap-1 items-end max-w-[70%]">
                        <Skeleton className="h-14 w-64 rounded-[18px] rounded-br-sm" />
                    </div>
                </div>

                <div className="flex items-end gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0 mb-1" />
                    <div className="flex flex-col gap-1 max-w-[70%]">
                        <Skeleton className="h-24 w-72 rounded-[18px] rounded-bl-sm" />
                    </div>
                </div>
            </div>

            {/* Input Skeleton */}
            <div className="p-4 pt-2">
                <Skeleton className="h-12 w-full rounded-3xl" />
            </div>
        </div>
    );
}

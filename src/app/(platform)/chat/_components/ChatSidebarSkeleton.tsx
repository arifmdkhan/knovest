import { Skeleton } from "@/components/ui/skeleton";

export function ChatSidebarSkeleton() {
    return (
        <div className="flex-1 flex flex-col gap-4 p-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

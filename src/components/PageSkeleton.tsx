import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ variant = "page" }: { variant?: "page" | "course" | "article" | "chat" | "room" }) {
    return <div className="page-skeleton w-full min-w-0" role="status" aria-label="Loading page" aria-busy="true">
        <span className="sr-only">Loading page. Please wait.</span>
        <div aria-hidden="true" className="flex flex-col gap-6">
            <div className="flex flex-col gap-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-2/3 max-w-md" /><Skeleton className="h-4 w-3/4 max-w-lg" /></div>
            {variant === "article" ? <div className="mx-auto flex w-full max-w-3xl flex-col gap-5"><Skeleton className="aspect-video w-full rounded-2xl" />{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className={index % 3 === 2 ? "h-4 w-3/4" : "h-4 w-full"} />)}</div>
                : variant === "course" ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="flex flex-col gap-4"><Skeleton className="h-40 w-full rounded-2xl" />{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)}</div><Skeleton className="h-80 w-full rounded-2xl" /></div>
                : variant === "chat" ? <div className="grid min-h-80 gap-4 md:grid-cols-[280px_minmax(0,1fr)]"><div className="flex flex-col gap-5 rounded-2xl border border-border p-4"><Skeleton className="h-10 w-full" />{Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="size-10 shrink-0 rounded-full" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></div></div>)}</div><Skeleton className="hidden h-[420px] w-full rounded-2xl md:block" /></div>
                : variant === "room" ? <><div className="flex flex-wrap gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-11 w-36" />)}</div><Skeleton className="h-10 w-full max-w-sm" /><div className="grid gap-5 md:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="flex flex-col gap-4 rounded-2xl border border-border p-5"><Skeleton className="h-5 w-36" /><Skeleton className="aspect-video w-full rounded-xl" /><Skeleton className="h-4 w-2/3" /></div>)}</div></>
                : <><Skeleton className="h-12 w-full rounded-xl" /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full" /></div>)}</div></>}
        </div>
    </div>;
}

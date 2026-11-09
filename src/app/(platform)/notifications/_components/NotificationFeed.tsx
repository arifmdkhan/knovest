"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead } from "@/features/notifications/actions/notifications.action";
import { NotificationItem } from "./NotificationItem";
import { Loader2, CheckCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

type Filter = "all" | "mentions" | "community" | "platform";

export function NotificationFeed() {
  const [filter, setFilter] = useState<Filter>("all");
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: ["notifications", filter],
    queryFn: async ({ pageParam }) => {
      const res = await getNotifications(pageParam, 15, filter);
      if (res.status === "error" || !res.data) throw new Error(res.message);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => lastPage.hasMore ? allPages.length + 1 : undefined,
    refetchInterval: 30000,
  });
  const { mutate: readMutation, isPending } = useMutation({
    mutationFn: async (id?: string) => {
      const res = await markAsRead(id);
      if (res.status === "error") throw new Error(res.message);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      if (!id) toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Failed to mark as read"),
  });
  useEffect(() => { if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage(); }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const notifications = data?.pages.flatMap(page => page.data) || [];
  const unread = data?.pages[0]?.unreadCount || 0;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs value={filter} onValueChange={value => setFilter(value as Filter)}>
        <TabsList className="max-w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>
      </Tabs>
      <Button variant="ghost" onClick={() => readMutation(undefined)} disabled={isPending || !unread} className="min-h-11 text-muted-foreground">
        <CheckCheck className="size-4" /> Mark all as read
      </Button>
    </div>
    <div className="app-panel overflow-hidden">
      {isLoading ? <div className="flex justify-center py-20" role="status" aria-label="Loading notifications"><Loader2 className="size-7 animate-spin text-primary" /></div>
      : isError && !data ? <div className="py-16 text-center space-y-3"><p className="text-muted-foreground">Couldn’t load notifications.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>
      : notifications.length === 0 ? <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
        <span className="mb-2 flex size-16 items-center justify-center rounded-2xl border border-border bg-primary/5"><Bell className="size-7 text-primary" /></span>
        <h2 className="text-lg font-semibold">You’re all caught up</h2>
        <p className="text-sm text-muted-foreground">{filter === "all" ? "New updates from your community will appear here." : "No notifications in this category yet."}</p>
      </div> : notifications.map(notification => <NotificationItem key={notification.id} notification={notification} onMarkRead={id => readMutation(id)} />)}
      {hasNextPage && <div ref={ref} className="flex justify-center p-5"><Button variant="ghost" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>{isFetchingNextPage ? <Loader2 className="size-5 animate-spin" /> : "Load more"}</Button></div>}
    </div>
  </div>;
}

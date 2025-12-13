import { useInfiniteQuery } from "@tanstack/react-query";
import { ConnectionType } from "@/app/data/user/get-connections";

export const useConnections = (userId: string, type: ConnectionType, isOpen: boolean) => {
    return useInfiniteQuery({
        queryKey: ["connections", userId, type],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            params.append("userId", userId);
            params.append("type", type);
            if (pageParam) params.append("cursor", pageParam as string);
            params.append("limit", "10");

            const res = await fetch(`/api/users/connections?${params.toString()}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to fetch connections");
            }
            return res.json();
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
        enabled: isOpen, // Only fetch when dialog is open
    });
};

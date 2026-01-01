import { useInfiniteQuery } from "@tanstack/react-query";
import { ConnectionType, ConnectionUser } from "@/features/user/queries/get-connections";
import { getConnectionsAction } from "@/features/user/connections.action";


export interface ConnectionPage {
    items: ConnectionUser[];
    nextCursor?: string;
}

export const useConnections = (userId: string, type: ConnectionType, isOpen: boolean) => {
    return useInfiniteQuery({
        queryKey: ["connections", userId, type],
        queryFn: async ({ pageParam }: { pageParam: unknown }): Promise<ConnectionPage> => {
            const res = await getConnectionsAction(userId, type, pageParam as string | undefined, 10);
            if (res.status === "error") throw new Error(res.message);
            if (!res.data) throw new Error("No data returned");
            return res.data;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: ConnectionPage) => lastPage.nextCursor,
        enabled: isOpen,
    });
};

import { useInfiniteQuery } from "@tanstack/react-query";
import { ConnectionType, ConnectionUser } from "@/app/data/user/get-connections";
import { getConnectionsAction } from "@/server/actions/user/get-connections-action";


export interface ConnectionPage {
    items: ConnectionUser[];
    nextCursor?: string;
}

export const useConnections = (userId: string, type: ConnectionType, isOpen: boolean) => {
    return useInfiniteQuery({
        queryKey: ["connections", userId, type],
        queryFn: async ({ pageParam }: { pageParam: unknown }) => {
            const res = await getConnectionsAction(userId, type, pageParam as string | undefined, 10);
            if (res.status === "error") throw new Error(res.message);
            return res.data as ConnectionPage;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: ConnectionPage) => lastPage.nextCursor,
        enabled: isOpen,
    });
};

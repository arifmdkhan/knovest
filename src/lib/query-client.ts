import { QueryClient, MutationCache } from "@tanstack/react-query";

export function createQueryClient() {
  const client = new QueryClient({
    mutationCache: new MutationCache({
      // Server revalidatePath does not invalidate the browser query cache.
      onSuccess: () => { void client.invalidateQueries(); },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 30 * 60_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
  return client;
}

// Refresh visible content while leaving inactive pages and hidden tabs alone.
export const contentQueryOptions = { refetchInterval: 60_000 } as const;

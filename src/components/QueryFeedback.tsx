"use client";

import { Button } from "@/components/ui/button";

export function QueryFeedback({ isError, isFetching, hasData, refetch }: {
  isError: boolean; isFetching: boolean; hasData: boolean; refetch: () => unknown;
}) {
  if (isError) return <div role="status" className="flex flex-wrap items-center justify-center gap-3 py-4 text-sm text-muted-foreground">
    <p>{hasData ? "Couldn’t refresh. Showing your last loaded content." : "Couldn’t load content."}</p>
    <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Try again</Button>
  </div>;
  if (isFetching && hasData) return <p role="status" className="sr-only">Updating content…</p>;
  return null;
}

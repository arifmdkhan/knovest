"use client";

import { useQuery } from "@tanstack/react-query";
import { readFollowSuggestions } from "@/features/content/read-actions";
import { FollowSuggestions, FollowSuggestionsSkeleton } from "./FollowSuggestions";
import { QueryFeedback } from "@/components/QueryFeedback";
import { contentQueryOptions } from "@/lib/query-client";

export function FollowSuggestionsContainer() {
  const query = useQuery({ queryKey: ["follow-suggestions"], queryFn: readFollowSuggestions, ...contentQueryOptions });
  if (query.isPending) return <FollowSuggestionsSkeleton />;
  return <><QueryFeedback {...query} hasData={query.data !== undefined} />{query.data && <FollowSuggestions users={query.data} />}</>;
}

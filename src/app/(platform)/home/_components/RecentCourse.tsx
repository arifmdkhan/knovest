"use client";

import { useQuery } from "@tanstack/react-query";
import { readRecentCourse } from "@/features/content/read-actions";
import { PublicCourseCard, PublicCourseCardSkeleton } from "@/app/(platform)/academy/course/_components/PublicCourseCard";
import { QueryFeedback } from "@/components/QueryFeedback";
import { contentQueryOptions } from "@/lib/query-client";

export function RecentCourse() {
  const query = useQuery({ queryKey: ["courses", "recent"], queryFn: readRecentCourse, ...contentQueryOptions });
  if (query.isPending) return <PublicCourseCardSkeleton />;
  return <><QueryFeedback {...query} hasData={query.data !== undefined} />{query.data && <div className="space-y-4">
    <h3 className="font-semibold text-lg px-1 mt-2">Fresh from Academy</h3>
    <PublicCourseCard data={query.data} priority />
  </div>}</>;
}

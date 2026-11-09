import { Suspense } from "react";
import { FollowSuggestionsContainer } from "./_components/right-sidebar/FollowSuggestionsContainer";
import { FollowSuggestionsSkeleton } from "./_components/right-sidebar/FollowSuggestions";
import { FeedTabs } from "./_components/FeedTabs";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { FeedSkeleton } from "./_components/Feed";
import { RecentCourse } from "./_components/RecentCourse";
import { PublicCourseCardSkeleton } from "@/app/(platform)/academy/course/_components/PublicCourseCard";

export const metadata: Metadata = createMetadata({
  title: "Home",
  description: "Stay ahead of the market with your personalized Knovest dashboard. Connect with top traders, track your courses, and get real-time insights tailored to your strategy.",
});

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* MAIN FEED AREA*/}
      <div className="min-w-0 lg:col-span-8">
        <Suspense fallback={<FeedSkeleton />}>
          <FeedTabs />
        </Suspense>
      </div>

      {/* RIGHT SIDEBAR (Desktop Only) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
        <div className="space-y-6">
          <Suspense fallback={<FollowSuggestionsSkeleton />}>
            <FollowSuggestionsContainer />
          </Suspense>

          <Suspense fallback={<div className="space-y-4 pt-2">
            <div className="h-6 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <PublicCourseCardSkeleton />
          </div>}>
            <RecentCourse />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
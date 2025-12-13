import { Suspense } from "react";
import { FollowSuggestionsContainer } from "./_components/right-sidebar/FollowSuggestionsContainer";
import { FollowSuggestionsSkeleton } from "./_components/right-sidebar/FollowSuggestions";
import { FeedTabs } from "./_components/FeedTabs";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getFeedPosts } from "@/app/data/post/get-posts";
import { getServerSession } from "@/lib/get-sessions";
import { FeedSkeleton } from "./_components/Feed";
import { getRecentPublicCourse } from "@/app/data/course/get-recent-course";
import { PublicCourseCard, PublicCourseCardSkeleton } from "@/app/(platform)/academy/course/_components/PublicCourseCard";

export const metadata: Metadata = createMetadata({
  title: "Home",
  description: "Stay ahead of the market with your personalized Consensus dashboard. Connect with top traders, track your courses, and get real-time insights tailored to your strategy.",
});

async function FeedLoader({ userId }: { userId?: string }) {
  const initialPosts = await getFeedPosts(undefined, 4, undefined, 'FOR_YOU', userId);
  return <FeedTabs initialData={initialPosts} />;
}

async function RecentCourseFetcher({ userId }: { userId: string }) {
  const course = await getRecentPublicCourse(userId);
  if (!course) return null;
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg px-1 mt-2">Fresh from Academy</h3>
      <PublicCourseCard data={course} />
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* MAIN FEED AREA (Center/Left) */}
      <div className="lg:col-span-7 xl:col-span-8">
        <Suspense fallback={<FeedSkeleton />}>
          <FeedLoader userId={session?.user?.id} />
        </Suspense>
      </div>

      {/* RIGHT SIDEBAR (Desktop Only) */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-6">
        <div className="top-14">
          <Suspense fallback={<FollowSuggestionsSkeleton />}>
            <FollowSuggestionsContainer />
          </Suspense>

          <Suspense fallback={<div className="space-y-4 pt-2">
            <div className="h-6 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <PublicCourseCardSkeleton />
          </div>}>
            {session?.user?.id && <RecentCourseFetcher userId={session.user.id} />}
          </Suspense>
        </div>
      </div>

    </div>
  );
}
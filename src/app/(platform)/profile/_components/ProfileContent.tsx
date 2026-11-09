"use client";

import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Grid } from "lucide-react";
import { ProfileFeed } from "./ProfileFeed";
import { ProfileCourses } from "./ProfileCourses";
import { ProfileArticles } from "./ProfileArticles";
import { useQuery } from "@tanstack/react-query";
import { readProfile } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileData } from "@/types/user";

export function ProfileContent({ username }: { username: string }) {
  const query = useQuery({ queryKey: ["profile-detail", username], queryFn: () => readProfile(username), ...contentQueryOptions });
  if (query.isPending) return <PageSkeleton />;
  if (query.data === null) return notFound();
  const feedback = <QueryFeedback {...query} hasData={query.data !== undefined} />;
  if (!query.data) return feedback;
  const profile = query.data;
  return (
    <div className="w-full space-y-6 pb-10">
      {feedback}
      <ProfileHeader profile={profile as unknown as ProfileData} />

      <div className="max-w-4xl mx-auto w-full">
        <Tabs defaultValue="posts" className="w-full">
          {/* Responsive Tabs List- horizontally Scrollable on mobile device*/}
          <div className="mx-auto w-full max-w-2xl overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="w-full justify-start [&>button]:flex-none">
              <TabsTrigger value="posts">
                <Grid className="w-4 h-4 mr-2" /> Posts
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="w-4 h-4 mr-2" /> Courses
              </TabsTrigger>
              <TabsTrigger value="articles">
                <FileText className="w-4 h-4 mr-2" /> Articles
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="posts" className="mt-6 mx-auto w-full min-w-0 max-w-2xl">
            <ProfileFeed authorId={profile.id} />
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <ProfileCourses authorId={profile.id} />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <ProfileArticles authorId={profile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

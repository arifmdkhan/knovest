import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Grid } from "lucide-react";
import { ProfileFeed } from "../_components/ProfileFeed";
import { ProfileCourses } from "../_components/ProfileCourses";
import { ProfileArticles } from "../_components/ProfileArticles";
import { getProfileByUsername } from "@/features/user/queries/get-profile";
import { ProfileHeader } from "../_components/ProfileHeader";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

import { ProfileData } from "@/types/user";

export const metadata: Metadata = createMetadata({
  title: "User Profile",
  description: "User profile page",
});

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) return notFound();

  return (
    <div className="w-full space-y-6 pb-10">
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

import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/premium-tabs";
import { BookOpen, FileText, Grid } from "lucide-react";
import { ProfileFeed } from "../_components/ProfileFeed";
import { ProfileCourses } from "../_components/ProfileCourses";
import { ProfileArticles } from "../_components/ProfileArticles";
import { getProfileByUsername } from "@/app/data/user/get-profile";
import { ProfileHeader } from "../_components/ProfileHeader";
import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata:Metadata = createMetadata({
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
    <div className="w-full min-h-screen pb-20">
      <ProfileHeader profile={profile as any} />

      <div className="container max-w-4xl mx-auto px-4 mt-6">
        <Tabs defaultValue="posts" className="w-full">
          {/* Responsive Tabs List: Scrollable on mobile */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <TabsList>
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

          <TabsContent value="posts" className="mt-6">
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
import { AppHero } from "@/components/AppHero";
import { creatorGetCourses } from "@/features/creator/queries/creator-get-courses";
import { getCreatorArticles } from "@/features/creator/queries/get-creator-articles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "@/components/AppLink";
import { Plus, BookOpen, Rocket } from "lucide-react";
import { Suspense } from "react";
import { CreatorCourseCardSkeletonLayout, RenderCourses } from "./courses/_components/creator-render-course";
import { CreatorArticleCard } from "./article/_components/creator-article-card";

export default async function CreatorPage() {
  const courses = await creatorGetCourses();
  const articles = await getCreatorArticles();

  return (
    <div className="w-full space-y-7">
      <AppHero title="Creator studio" description="Share what you know. Create and manage your courses and articles." />

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">Your Courses</h2>
            <Link href="/academy/creator/courses/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Course
              </Button>
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="app-panel text-center py-20 px-6">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No courses yet</h3>
              <p className="text-muted-foreground mb-6">
                Start sharing your knowledge by creating your first course.
              </p>
              <Link href="/academy/creator/courses/create">
                <Button variant="outline">Create Course</Button>
              </Link>
            </div>
          ) : (
            <Suspense fallback={<CreatorCourseCardSkeletonLayout />}>
              <RenderCourses />
            </Suspense>
          )}
        </TabsContent>

        <TabsContent value="articles" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">Your Articles</h2>
            <Link href="/academy/creator/article/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Article
              </Button>
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="app-panel text-center py-20 px-6">
              <Rocket className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No articles yet</h3>
              <p className="text-muted-foreground mb-6">
                Start sharing your knowledge by writing your first article.
              </p>
              <Link href="/academy/creator/article/create">
                <Button variant="outline">Create Article</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <CreatorArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
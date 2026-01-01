import { creatorGetCourses } from "@/features/creator/queries/creator-get-courses";
import { getCreatorArticles } from "@/features/creator/queries/get-creator-articles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen, Rocket } from "lucide-react";
import { Suspense } from "react";
import { CreatorCourseCardSkeletonLayout, RenderCourses } from "./courses/_components/creator-render-course";
import { CreatorArticleCard } from "./article/_components/creator-article-card";

export default async function CreatorPage() {
  const courses = await creatorGetCourses();
  const articles = await getCreatorArticles();

  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses and articles from one place.
          </p>
        </div>
      </div>

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
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
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
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
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
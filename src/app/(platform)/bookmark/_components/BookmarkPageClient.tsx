
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedPostsTab } from "./SavedPostsTab";
import { SavedCoursesTab } from "./SavedCoursesTab";
import { SavedArticlesTab } from "./SavedArticlesTab";
import { Bookmark, LayoutGrid, FileText } from "lucide-react";

export function BookmarkPageClient() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 w-full min-h-screen">
            <div className="flex flex-col gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bookmark className="w-5 h-5 text-primary fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                        Bookmarks
                    </h1>
                </div>
                <p className="text-muted-foreground ml-11">
                    Manage your personal library of saved posts, courses, and articles.
                </p>
            </div>

            <Tabs defaultValue="posts" className="w-full space-y-8">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-secondary/30 p-1 backdrop-blur-sm border border-border/50">
                    <TabsTrigger
                        value="posts"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Posts
                    </TabsTrigger>
                    <TabsTrigger
                        value="courses"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
                    >
                        <Bookmark className="w-4 h-4 mr-2" />
                        Courses
                    </TabsTrigger>
                    <TabsTrigger
                        value="articles"
                        className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Articles
                    </TabsTrigger>
                </TabsList>

                <div className="min-h-[400px]">
                    <TabsContent value="posts" className="mt-0 outline-hidden">
                        <SavedPostsTab />
                    </TabsContent>

                    <TabsContent value="courses" className="mt-0 outline-hidden">
                        <SavedCoursesTab />
                    </TabsContent>

                    <TabsContent value="articles" className="mt-0 outline-hidden">
                        <SavedArticlesTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

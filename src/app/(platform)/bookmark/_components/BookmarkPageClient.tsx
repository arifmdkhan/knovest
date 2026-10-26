import { AppHero } from "@/components/AppHero";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedPostsTab } from "./SavedPostsTab";
import { SavedCoursesTab } from "./SavedCoursesTab";
import { SavedArticlesTab } from "./SavedArticlesTab";
import { Bookmark, LayoutGrid, FileText } from "lucide-react";

export function BookmarkPageClient() {
    return (
        <div className="w-full space-y-7">
            <AppHero title={<span className="flex items-center gap-3"><Bookmark className="size-8 text-primary" />Bookmarks</span>} description="Your personal library. Save what inspires you, revisit what matters." />

            <Tabs defaultValue="posts" className="w-full space-y-8">
                <TabsList className="grid w-full max-w-[430px] grid-cols-3">
                    <TabsTrigger
                        value="posts"
                        className="transition-colors"
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Posts
                    </TabsTrigger>
                    <TabsTrigger
                        value="courses"
                        className="transition-colors"
                    >
                        <Bookmark className="w-4 h-4 mr-2" />
                        Courses
                    </TabsTrigger>
                    <TabsTrigger
                        value="articles"
                        className="transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Articles
                    </TabsTrigger>
                </TabsList>

                <div className="min-h-[400px]">
                    <TabsContent value="posts" className="mt-0 mx-auto w-full min-w-0 max-w-2xl outline-hidden">
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

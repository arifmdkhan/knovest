'use client'

import { ExpandableDescription } from "@/app/(platform)/academy/course/_components/expandable-description";
import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { Button } from "@/components/ui/button";

import { BookIcon, CheckCircle, FileText, LayoutDashboard, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { constructUrl } from "@/lib/construct-url";

interface CourseContentProps {
  data: LessonContentType;
}

function VideoPlayer({ thumbnailKey, videoKey }: {
  thumbnailKey: string;
  videoKey: string
}) {
  const videoUrl = constructUrl(videoKey);
  const thumbnailUrl = constructUrl(thumbnailKey)

  if (!videoKey) {
    return (
      <div className="aspect-video bg-muted/30 rounded-xl flex flex-col items-center justify-center border border-border/50">
        <BookIcon className="size-16 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">This lesson does not have a video</p>
      </div>
    )
  }

  return (
    <div className="aspect-video bg-black rounded-xl relative overflow-hidden shadow-lg ring-1 ring-border/10">
      <video
        src={videoUrl}
        className="w-full h-full object-cover"
        controls
        poster={thumbnailUrl}
      />
    </div>
  )
}

export function CourseContent({ data }: CourseContentProps) {

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <div className="p-6 space-y-6">
        {/* Video Section */}
        <VideoPlayer thumbnailKey={data.thumbnailKey ?? ''} videoKey={data.videoKey ?? ''} />

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground line-clamp-2">
            {data.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="size-4" />
              Share
            </Button>
            <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700">
              <CheckCircle className="size-4" />
              Mark Complete
            </Button>
          </div>
        </div>

        <Separator />

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto w-full sm:w-auto justify-start">
            <TabsTrigger value="overview" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutDashboard className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="size-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 outline-none animate-in fade-in-50 duration-500">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">About this lesson</h3>
              {data.description ? (
                <ExpandableDescription html={data.description} limit={200} />
              ) : (
                <p className="text-muted-foreground italic">No description available for this lesson.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6 outline-none animate-in fade-in-50 duration-500">
            <div className="bg-muted/30 rounded-lg p-8 text-center border border-border/50 border-dashed">
              <FileText className="size-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-medium text-foreground">No resources attached</h3>
              <p className="text-sm text-muted-foreground mt-1">There are no downloadable resources for this lesson.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedPost } from "@/types/post";
import { FeedType } from "@/hooks/use-post";
import { InfiniteFeed } from "./Feed";


const PostComposer = dynamic(() => import("./PostComposer").then(mod => mod.PostComposer), {
    ssr: false,
    loading: () => <div className="w-full h-32 bg-card border border-border rounded-xl mb-6 animate-pulse" />
});

export function FeedTabs({ initialData }: { initialData?: { posts: FeedPost[], nextCursor?: string } }) {
    const [feedType, setFeedType] = useState<FeedType>('FOR_YOU');

    return (
        <div className="space-y-6">
            <PostComposer />

            <Tabs defaultValue="FOR_YOU" value={feedType} onValueChange={(v) => setFeedType(v as FeedType)} className="w-full">
                <TabsList className="w-full justify-start [&>button]:flex-none">
                    <TabsTrigger value="FOR_YOU">
                        For You
                    </TabsTrigger>
                    <TabsTrigger value="FOLLOWING">
                        Following
                    </TabsTrigger>
                    <TabsTrigger value="SUBSCRIBED">
                        Subscribed
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <InfiniteFeed type={feedType} initialData={feedType === 'FOR_YOU' ? initialData : undefined} />
                </div>
            </Tabs>
        </div>
    );
}

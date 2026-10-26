"use client";

import { FeedType } from "@/hooks/use-post";
import { Newspaper, Users, Crown } from "lucide-react";

export function EmptyFeedState({ type }: { type: FeedType }) {
    const content = {
        FOR_YOU: {
            icon: Newspaper,
            title: "No posts yet",
            description: "Your personalized feed is empty. Start following people or creating content!"
        },
        FOLLOWING: {
            icon: Users,
            title: "No posts from following",
            description: "Follow more creators to see their posts here."
        },
        SUBSCRIBED: {
            icon: Crown,
            title: "No exclusive content",
            description: "Subscribe to creators to see their premium content here."
        }
    }[type] || {
        icon: Newspaper,
        title: "No posts found",
        description: "There are no posts to display at the moment."
    };

    const Icon = content.icon;

    return (
        <div className="app-panel flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4 ring-1 ring-border/50">
                <Icon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                {content.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {content.description}
            </p>
        </div>
    );
}

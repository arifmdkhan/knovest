"use client";

import { FileText } from "lucide-react";
import { BookmarkEmptyState } from "./BookmarkEmptyState";

export function SavedArticlesTab() {
    const isEmpty = true;

    if (isEmpty) {
        return (
            <BookmarkEmptyState
                icon={FileText}
                title="No saved articles"
                description="Build your reading list. Save insightful articles to read at your own pace."
                actionLabel="Read Articles"
                actionLink="/academy"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Article cards will go here */}
        </div>
    );
}

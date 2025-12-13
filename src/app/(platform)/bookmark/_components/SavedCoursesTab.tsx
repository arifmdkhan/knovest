"use client";

import { BookOpen } from "lucide-react";
import { BookmarkEmptyState } from "./BookmarkEmptyState";

export function SavedCoursesTab() {
    // TODO: Implement fetching logic when endpoint is available
    const isEmpty = true;

    if (isEmpty) {
        return (
            <BookmarkEmptyState
                icon={BookOpen}
                title="No saved courses"
                description="Your learning journey starts here. Bookmark courses to build your personal curriculum."
                actionLabel="Browse Academy"
                actionLink="/academy"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Course cards will go here */}
        </div>
    );
}

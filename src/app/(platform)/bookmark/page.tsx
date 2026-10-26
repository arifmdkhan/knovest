import { createMetadata } from "@/lib/metadata";
import { BookmarkPageClient } from "./_components/BookmarkPageClient";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Bookmarks",
  description: "Access your saved posts, articles, and courses. Build your personal library of trading knowledge on Knovest.",
});

export default function BookmarksPage() {
  return <BookmarkPageClient />;
}
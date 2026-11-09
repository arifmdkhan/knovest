import { SearchContent } from "./_components/SearchContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({ title: "Search", description: "Explore the Knovest ecosystem. Find expert mentors, comprehensive courses, trending articles, and verified community members to accelerate your trading success." });

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <SearchContent query={(await searchParams).q || ""} />;
}

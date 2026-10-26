"use client";

import { useSearchParams } from "next/navigation";
import Link from "@/components/AppLink";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { courseCategories, courseLevels } from "@/features/courses/schemas";

export function CategoryFilter() {
  const params = useSearchParams();
  const category = params.get("category") || "";
  const chipHref = (value: string) => { const next = new URLSearchParams(params.toString()); if (value) next.set("category", value); else next.delete("category"); return `/academy/course?${next}`; };
  return <div className="space-y-4">
    <form action="/academy/course" className="app-panel flex flex-wrap items-end gap-3 p-4" key={params.toString()}>
      <div className="min-w-[180px] flex-1"><label htmlFor="course-search" className="mb-2 block text-xs font-medium text-muted-foreground">Search courses</label><div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input id="course-search" name="q" defaultValue={params.get("q") || ""} placeholder="What do you want to learn?" className="pl-9" /></div></div>
      <div className="flex-1 sm:flex-none"><label htmlFor="course-category" className="mb-2 block text-xs font-medium text-muted-foreground">Category</label><select id="course-category" name="category" defaultValue={category} className="h-11 w-full max-w-[220px] rounded-lg border border-input bg-background px-3 text-sm"><option value="">All categories</option>{courseCategories.map(value => <option key={value}>{value}</option>)}</select></div>
      <div className="flex-1 sm:flex-none"><label htmlFor="course-level" className="mb-2 block text-xs font-medium text-muted-foreground">Level</label><select id="course-level" name="level" defaultValue={params.get("level") || ""} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">All levels</option>{courseLevels.map(value => <option key={value}>{value}</option>)}</select></div>
      <div className="flex-1 sm:flex-none"><label htmlFor="course-sort" className="mb-2 block text-xs font-medium text-muted-foreground">Sort by</label><select id="course-sort" name="sort" defaultValue={params.get("sort") || "recent"} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="recent">Newest first</option><option value="price">Price: low to high</option></select></div>
      <Button type="submit" className="h-11">Apply</Button>
    </form>
    <div className="flex flex-wrap gap-2" aria-label="Popular course categories">{["", "Equities", "Technical Analysis", "Options Strategies", "Personal Finance"].map(value => <Link key={value} href={chipHref(value)} aria-current={category === value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-lg border px-4 text-sm transition-colors ${category === value ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{value || "All courses"}</Link>)}</div>
  </div>;
}

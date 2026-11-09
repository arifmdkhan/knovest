"use client";

import Link from "@/components/AppLink";
import { BookOpen, GraduationCap, Layout, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { readAcademyAccess, readCourses } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AcademyCard } from "./AcademyCard";
import { AppHero } from "@/components/AppHero";
import { Button } from "@/components/ui/button";
import { PublicCourseCard } from "../course/_components/PublicCourseCard";

export function AcademyContent() {
  const access = useQuery({ queryKey: ["academy-access"], queryFn: readAcademyAccess });
  const query = useQuery({ queryKey: ["courses", {}], queryFn: () => readCourses(), ...contentQueryOptions });
  const showCreatorDashboard = access.data;
  const courses = query.data || [];
  return (
    <div className="space-y-8">
      <AppHero title={<>Knovest <span className="text-primary">Academy</span></>} description="Build your knowledge. Sharpen your edge. Learn from people who know the markets.">
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button asChild><Link href="/academy/course">Browse courses <ArrowRight className="size-4" /></Link></Button>
          {showCreatorDashboard && <Button variant="outline" asChild><Link href="/academy/creator">Creator dashboard</Link></Button>}
        </div>
        <GraduationCap className="absolute right-10 top-0 hidden size-36 rotate-[-12deg] text-primary/25 xl:block" strokeWidth={1} aria-hidden="true" />
      </AppHero>
      <section aria-label="Explore the academy" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <AcademyCard href="/academy/course" icon={GraduationCap} title="Browse courses" description="Practical lessons from verified experts." actionText="Explore courses" />
        <AcademyCard href="/academy/article" icon={Layout} title="Read articles" description="Fresh perspectives, insights, and ideas." actionText="Explore articles" />
        <AcademyCard href="/academy/enrolled" icon={BookOpen} title="My learning" description="Pick up where you left off." actionText="Continue learning" />
      </section>
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold tracking-tight">Explore your next chapter</h2><Link className="text-sm text-primary hover:underline" href="/academy/course">View all courses →</Link></div>
        <QueryFeedback {...query} hasData={query.data !== undefined} />
        {query.isPending ? <PageSkeleton /> : !query.data ? null : courses.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{courses.slice(0, 3).map(course => <PublicCourseCard key={course.id} data={course} />)}</div>
        : <div className="app-panel px-6 py-16 text-center"><GraduationCap className="mx-auto mb-4 size-9 text-primary" /><h3 className="font-semibold">New learning opportunities ahead</h3><p className="mt-2 text-sm text-muted-foreground">Published courses will appear here. Explore articles in the meantime.</p><Button asChild variant="outline" className="mt-5"><Link href="/academy/article">Read articles</Link></Button></div>}
      </section>
    </div>
  );
}

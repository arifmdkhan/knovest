"use client";

import { useQuery } from "@tanstack/react-query";
import { readDashboard } from "@/features/content/read-actions";
import { contentQueryOptions } from "@/lib/query-client";
import { QueryFeedback } from "@/components/QueryFeedback";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AppHero } from "@/components/AppHero";
import { ChartAreaInteractive } from "@/components/creator-dashboard/chart-area-interactive";
import { SectionCards } from "@/components/creator-dashboard/section-cards";
import { SubscribersTable } from "@/components/creator-dashboard/subscribers-table";
import { EnrollmentsTable } from "@/components/creator-dashboard/enrollments-table";
import Link from "@/components/AppLink"
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MonitorPlay } from "lucide-react";


export function DashboardContent() {
    const query = useQuery({ queryKey: ["creator-dashboard"], queryFn: readDashboard, ...contentQueryOptions });
    if (query.isPending) return <PageSkeleton />;
    const feedback = <QueryFeedback {...query} hasData={query.data !== undefined} />;
    if (!query.data) return feedback;
    const { enrollmentsData, subscribers, enrollments, stats } = query.data;
    return (
        <div className="flex flex-col gap-6">
            {feedback}
            <AppHero title="Creator dashboard" description="Your community, courses, and learning activity at a glance." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/academy/creator">
                    <Button variant="outline" className="w-full h-12 text-lg gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all">
                        <LayoutDashboard className="w-5 h-5" />
                        Creator Studio
                    </Button>
                </Link>
                <Link href="/trade-room">
                    <Button variant="outline" className="w-full h-12 text-lg gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all">
                        <MonitorPlay className="w-5 h-5" />
                        Trade Room
                    </Button>
                </Link>
            </div>

            <SectionCards stats={stats} />

            <ChartAreaInteractive data={enrollmentsData} />

            <div className="flex flex-col gap-6">
                <SubscribersTable subscribers={subscribers} />
                <EnrollmentsTable enrollments={enrollments} />
            </div>
        </div>
    )

}
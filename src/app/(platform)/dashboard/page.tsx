import { creatorGetEnrollmentStats } from "@/features/creator/queries/creator-get-enrollment-stats"
import { getCreatorSubscribers } from "@/features/creator/queries/get-creator-subscribers"
import { getCreatorEnrollments } from "@/features/creator/queries/get-creator-enrollments"
import { ChartAreaInteractive } from "@/components/creator-dashboard/chart-area-interactive"
import { SectionCards } from "@/components/creator-dashboard/section-cards"
import { SubscribersTable } from "@/components/creator-dashboard/subscribers-table"
import { EnrollmentsTable } from "@/components/creator-dashboard/enrollments-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, MonitorPlay } from "lucide-react"


export default async function CreatorDashboardPage() {

    const [enrollmentsData, subscribers, enrollments] = await Promise.all([
        creatorGetEnrollmentStats(),
        getCreatorSubscribers(),
        getCreatorEnrollments()
    ])

    return (
        <div className="flex flex-col gap-6">
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

            <SectionCards />

            <ChartAreaInteractive data={enrollmentsData} />

            <div className="flex flex-col gap-6">
                <SubscribersTable subscribers={subscribers} />
                <EnrollmentsTable enrollments={enrollments} />
            </div>
        </div>
    )

}

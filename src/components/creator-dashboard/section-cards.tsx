import { Users, UserCheck, BookOpen } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { creatorGetDashboardStats } from "@/features/creator/queries/creator-get-dashboard-stats";


export async function SectionCards() {
  const { totalSubscriptions, totalEnrollments, totalCourses } = await creatorGetDashboardStats()

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      {/* Card 1: Total Subscriptions */}
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>Total Subscriptions</CardDescription>
            <UserCheck className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSubscriptions}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <p className="text-muted-foreground">Active subscribers</p>
        </CardFooter>
      </Card>

      {/* Card 2: Total Enrollments */}
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>Total Enrollments</CardDescription>
            <Users className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalEnrollments}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <p className="text-muted-foreground">Students enrolled in your courses</p>
        </CardFooter>
      </Card>

      {/* Card3: Total Courses */}
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>Total Courses</CardDescription>
            <BookOpen className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCourses}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <p className="text-muted-foreground">Courses created by you</p>
        </CardFooter>
      </Card>

    </div>
  )
}

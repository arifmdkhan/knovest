import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Layout,
  ArrowRight
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { createMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { AcademyCard } from "./_components/AcademyCard";

export const metadata: Metadata = createMetadata({
  title: "Academy",
  description: "Master your craft with Consensus Academy. Access expert-led courses, in-depth articles, and a community of learners dedicated to elevating their trading journey.",
});

export default async function AcademyPage() {
  const session = await getServerSession();
  let showCreatorDashboard = false;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, expertVerificationType: true },
    });
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || !!user?.expertVerificationType) {
      showCreatorDashboard = true;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        <header className="text-center space-y-6 py-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Consensus Academy
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
            Master your craft. Share your knowledge. <br />
            <span className="text-primary font-medium">Elevate your journey.</span>
          </p>
        </header>

        {showCreatorDashboard && (
          <div className="flex justify-center">
            <Link href="/academy/creator" className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-primary font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary hover:bg-primary/90">
              Creator Dashboard
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute -inset-3 rounded-xl bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
            </Link>
          </div>
        )}

        {/* Courses Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Courses & Articles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">


            {/* All Courses */}
            <AcademyCard
              href="/academy/course"
              icon={GraduationCap}
              title="Browse Courses"
              description="Explore a vast library of knowledge curated by industry experts."
              actionText="Start Learning"
              color="cyan"
            />

            {/* All Articles */}
            <AcademyCard
              href="/academy/article"
              icon={Layout}
              title="Read Articles"
              description="Discover the latest trends, tutorials, and community stories."
              actionText="Explore"
              color="cyan"
            />

            {/* My Learning */}
            <AcademyCard
              href="/academy/enrolled"
              icon={BookOpen}
              title="My Learning"
              description="Track your progress and resume where you left off."
              actionText="Go to Dashboard"
              color="cyan"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

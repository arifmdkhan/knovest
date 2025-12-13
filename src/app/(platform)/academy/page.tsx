import Link from "next/link";
import {
  BookOpen,
  PenTool,
  GraduationCap,
  Layout,
  Plus,
  FileText,
  ArrowRight
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { createMetadata } from "@/lib/metadata";
import { Metadata } from "next";

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
      select: { role: true },
    });
    if (user?.role === "CREATOR" || user?.role === "ADMIN") {
      showCreatorDashboard = true;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header Section */}
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
            <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">


            {/* See Courses */}
            <Link href="/academy/course" className="group">
              <div className="h-full p-8 rounded-3xl bg-card/40 dark:bg-card/50 backdrop-blur-xl border border-border/50 dark:border-white/10 hover:border-accent/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_var(--color-accent)] hover:-translate-y-2 flex flex-col items-start justify-between gap-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/10 dark:group-hover:bg-accent/20 transition-all duration-500" />

                <div className="p-4 rounded-2xl bg-accent/10 text-accent-foreground dark:text-accent group-hover:scale-110 transition-transform duration-500">
                  <GraduationCap className="w-8 h-8" />
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white group-hover:text-accent-foreground dark:group-hover:text-accent transition-colors">Browse Courses</h3>
                  <p className="text-muted-foreground">Explore a vast library of knowledge curated by industry experts.</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground dark:text-accent opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Start Learning <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* My Courses */}
            <Link href="/academy/enrolled" className="group">
              <div className="h-full p-8 rounded-3xl bg-card/40 dark:bg-card/50 backdrop-blur-xl border border-border/50 dark:border-white/10 hover:border-foreground/30 dark:hover:border-white/30 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] hover:-translate-y-2 flex flex-col items-start justify-between gap-8 overflow-hidden relative">

                <div className="p-4 rounded-2xl bg-foreground/5 dark:bg-white/5 text-foreground dark:text-white group-hover:scale-110 transition-transform duration-500">
                  <BookOpen className="w-8 h-8" />
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white">My Learning</h3>
                  <p className="text-muted-foreground">Track your progress and resume where you left off.</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Articles Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-500">
              <PenTool className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Articles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">


            {/* All Articles */}
            <Link href="/academy/article" className="group">
              <div className="h-full p-8 rounded-3xl bg-card/40 dark:bg-card/50 backdrop-blur-xl border border-border/50 dark:border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] hover:-translate-y-2 flex flex-col items-start justify-between gap-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-500/20 transition-all duration-500" />

                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 group-hover:scale-110 transition-transform duration-500">
                  <Layout className="w-8 h-8" />
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-500 transition-colors">Read Articles</h3>
                  <p className="text-muted-foreground">Discover the latest trends, tutorials, and community stories.</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-500 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Explore <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* My Articles */}
            <Link href="/academy/article?filter=my" className="group">
              <div className="h-full p-8 rounded-3xl bg-card/40 dark:bg-card/50 backdrop-blur-xl border border-border/50 dark:border-white/10 hover:border-foreground/30 dark:hover:border-white/30 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] hover:-translate-y-2 flex flex-col items-start justify-between gap-8 overflow-hidden relative">

                <div className="p-4 rounded-2xl bg-foreground/5 dark:bg-white/5 text-foreground dark:text-white group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-8 h-8" />
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white">My Articles</h3>
                  <p className="text-muted-foreground">Manage your published content and drafts.</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  View Portfolio <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

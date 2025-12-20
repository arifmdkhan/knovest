import { createMetadata } from "@/lib/metadata";
import {
    ShieldCheck,
    Users,
    TrendingUp,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { Metadata } from "next";

export const metadata:Metadata = createMetadata({
    title: "About Us",
    description: "About CONSENSUS - A financial learning and community platform built to help people learn, share, and grow together.",
});

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">

            {/* Hero / About CONSENSUS Section */}
            <section className="relative py-20 lg:py-24 overflow-hidden items-center flex flex-col justify-center text-center px-4 border-b border-border/40">
                <div className="absolute inset-0 -z-10 bg-primary/5" />

                <div className="container max-w-4xl mx-auto space-y-6 relative z-10">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-4">
                        <span>About CONSENSUS</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight pb-2">
                        A Financial Learning & Community Platform.
                    </h1>
                    <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-left md:text-center mt-6">
                        <p>
                            CONSENSUS is built to help people learn, share, and grow together in the world of finance, investing, and trading.
                        </p>
                        <p>
                            Every year, millions of people lose money due to misinformation, unverified “gurus,” and fragmented learning experiences spread across social media, messaging apps, and isolated platforms. At the same time, genuine and qualified experts often operate independently, making it difficult for learners to compare, evaluate, and choose the right source of knowledge.
                        </p>
                        <p className="font-medium text-foreground">
                            We are building a single, trusted platform that brings <span className="text-primary">learners and verified financial experts together</span>- transparently, affordably, and responsibly.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 bg-card sm:py-24">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Our Mission</h2>
                    <p className="text-xl md:text-2xl font-light text-muted-foreground leading-relaxed">
                        To make financial education <span className="text-foreground font-medium">accessible, transparent, and trustworthy</span> by connecting learners with the right knowledge from the right people.
                    </p>
                </div>
            </section>

            {/* What We Do Section */}
            <section className="py-20 border-y border-border/40">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">What We Do</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Consensus combines <span className="text-foreground font-medium">financial education, community interaction, and expert-led learning</span> into one integrated experience.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-background border border-border/50 rounded-2xl p-8 space-y-4 hover:border-primary/20 transition-all">
                            <Users className="w-10 h-10 text-primary mb-2" />
                            <h3 className="text-xl font-bold">For Learners</h3>
                            <ul className="space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>Learn from verified and experienced educators</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>Access structured courses, articles, and live sessions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <span>Participate in discussions, groups, and real-time conversations</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-background border border-border/50 rounded-2xl p-8 space-y-4 hover:border-primary/20 transition-all flex flex-col">
                            <TrendingUp className="w-10 h-10 text-primary mb-2" />
                            <h3 className="text-xl font-bold">For Growth</h3>
                            <p className="text-muted-foreground">
                                Connect with mentors and communities aligned with your learning goals. We focus on <span className="text-foreground font-medium">education first</span> - not tips, signals, or promises of returns.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust & Transparency */}
            <section className="py-20 bg-muted/20">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 text-primary font-medium">
                                <ShieldCheck className="w-5 h-5" />
                                <span>Core Values</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Built on Trust & Transparency</h2>
                            <p className="text-lg text-muted-foreground">
                                We believe trust is non-negotiable in financial education. Financial learning should empower people - not mislead them.
                            </p>
                            <div className="space-y-4 pt-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Verified Credentials</h4>
                                        <p className="text-muted-foreground text-sm">We clearly display educator credentials and verification status.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Open Discussions</h4>
                                        <p className="text-muted-foreground text-sm">We encourage open discussions and genuine reviews.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Responsible Education</h4>
                                        <p className="text-muted-foreground text-sm">We do not promote unregulated investment advice and follow Indian regulatory standards.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative aspect-square lg:aspect-4/3 rounded-3xl overflow-hidden bg-background border border-border shadow-xl p-8 flex items-center justify-center text-center">
                            <div className="space-y-4">
                                <Users className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                                <h3 className="text-2xl font-bold">Who We&apos;re For</h3>
                                <ul className="text-muted-foreground space-y-3 text-left max-w-sm mx-auto list-disc pl-5">
                                    <li><strong className="text-foreground">Learners</strong> who want to understand finance, investing, and trading the right way</li>
                                    <li><strong className="text-foreground">Educators & professionals</strong> who want to teach responsibly and build communities</li>
                                    <li><strong className="text-foreground">Anyone</strong> who believes financial literacy is a long-term skill, not a shortcut</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="py-24 text-center">
                <div className="container mx-auto px-4 max-w-3xl space-y-6">
                    <h2 className="text-3xl font-bold text-primary">Our Vision</h2>
                    <p className="text-2xl md:text-3xl font-medium leading-tight">
                        To become India’s most trusted, verified financial learning and mentorship platform - where education, community, and credibility come together.
                    </p>
                </div>
            </section>

        </div>
    );
}

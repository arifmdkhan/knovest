import { createMetadata } from "@/lib/metadata";
import { Badge } from "@/components/ui/badge";
import {
    Radio,
    BookOpen,
    Users,
    LineChart,
    Zap,
    ShieldCheck,
    MessageSquare,
    Lock,
    Globe,
    CreditCard,
    UserCircle,
    ShieldAlert
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
    title: "Platform Features",
    description: "A Unified Platform for Financial Learning & Community.",
});

const features = [
    {
        icon: Users,
        title: "1. Social Learning Feed",
        tagline: "A real-time social feed where learners and experts can share knowledge, insights, and experiences.",
        offers: [
            "Educational posts, market insights, and discussions",
            "Follow experts, educators, and other learners",
            "Engage through likes, comments, and shares",
            "Content visibility controls (public, followers, subscribers)"
        ],
        whyItMatters: "Learning finance is better when people can learn from real conversations, not isolated content.",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10"
    },
    {
        icon: ShieldCheck,
        title: "2. Verified Expert Profiles",
        tagline: "Only credible educators should teach finance.",
        offers: [
            "Expert profiles with credentials and verification status",
            "Transparent display of courses, articles, and subscriptions",
            "Followers, reviews, and engagement visibility",
            "Clear distinction between learners and educators"
        ],
        whyItMatters: "Helps users identify the right source of knowledge and avoid misinformation.",
        color: "text-green-500",
        bgColor: "bg-green-500/10"
    },
    {
        icon: BookOpen,
        title: "3. Structured Courses",
        tagline: "Professionally structured learning, not scattered videos.",
        offers: [
            "Courses with chapters and lessons",
            "Free and paid course options",
            "Video and article-based learning",
            "Easy purchase and lifetime access (where applicable)"
        ],
        whyItMatters: "Learners get clarity, progression, and depth - not random content.",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10"
    },
    {
        icon: LineChart, // Or FileText if purely "Articles"
        title: "4. Articles & Written Learning",
        tagline: "Deep insights that go beyond short posts.",
        offers: [
            "Long-form articles by educators and professionals",
            "Topic-based categorization",
            "Free and premium access options",
            "Save and revisit anytime"
        ],
        whyItMatters: "Some concepts require explanation, not soundbites.",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10"
    },
    {
        icon: Zap,
        title: "5. Subscriptions & Mentorship",
        tagline: "Direct access to educators - simplified.",
        offers: [
            "Subscribe to verified experts",
            "Access premium content and mentorship",
            "Automatic access control for subscribers",
            "Easy renewals and cancellations"
        ],
        whyItMatters: "Learners pay only for what they value. Educators manage less, teach more.",
        color: "text-pink-500",
        bgColor: "bg-pink-500/10"
    },
    {
        icon: MessageSquare,
        title: "6. Premium Groups & Chat",
        tagline: "Learning improves with interaction.",
        offers: [
            "1-to-1 chat between learners and mentors",
            "Free and premium group chats",
            "Automatic removal when subscriptions end",
            "Secure, role-based group permissions"
        ],
        whyItMatters: "Creates focused learning communities without manual admin work.",
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10"
    },
    {
        icon: Radio,
        title: "7. Live Streaming & Audio Rooms",
        tagline: "Learn live, ask questions, and interact in real time.",
        offers: [
            "Live video and audio sessions by experts",
            "Screen sharing and presentations",
            "Scheduled or instant sessions",
            "Controlled access (specific groups or subscribers)"
        ],
        whyItMatters: "Real-time learning builds clarity, confidence, and trust.",
        color: "text-red-500",
        bgColor: "bg-red-500/10"
    },
    {
        icon: Lock,
        title: "8. Smart Access Control",
        tagline: "The right content for the right audience.",
        offers: [
            "Role-based access (Admin, Creator, User)",
            "Content visibility rules",
            "Subscription-based permissions",
            "Automated access enforcement"
        ],
        whyItMatters: "Prevents misuse, simplifies management, and ensures fairness.",
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10"
    },
    {
        icon: CreditCard,
        title: "9. Secure Payments",
        tagline: "Simple, transparent, and secure transactions.",
        offers: [
            "UPI, cards, and international payments",
            "Course purchases and subscriptions",
            "Automatic access updates",
            "Clear payment history"
        ],
        whyItMatters: "Trust in payments is critical for education platforms.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10"
    },
    {
        icon: UserCircle,
        title: "10. User Activity Tracking",
        tagline: "Your learning journey, in one place.",
        offers: [
            "Personal profiles with bio and activity",
            "Follow/follower system",
            "Course progress and engagement tracking",
            "Saved content and history"
        ],
        whyItMatters: "Helps users stay consistent and motivated.",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10"
    },
    {
        icon: ShieldAlert,
        title: "11. Admin & Safety Tools",
        tagline: "Responsible platforms need oversight.",
        offers: [
            "User and content moderation",
            "Role and permission management",
            "Abuse reporting and review",
            "Compliance-friendly architecture"
        ],
        whyItMatters: "Keeps the platform safe, reliable, and scalable.",
        color: "text-slate-500",
        bgColor: "bg-slate-500/10"
    }
];

export default function FeaturesPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Hero Section */}
            <section className="py-24 text-center relative overflow-hidden border-b border-border/40">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                <div className="container mx-auto px-4 max-w-4xl space-y-6">
                    <Badge variant="outline" className="px-4 py-1 text-base rounded-full border-primary/50 text-primary">
                        Platform Features
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        A Unified Platform for <br /> <span className="text-primary">Financial Learning & Community</span>
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        Consensus is designed to bring financial education, expert guidance, and community interaction into one seamless experience. Every feature exists to help learners make informed decisions and to help educators teach responsibly and efficiently.
                    </p>
                </div>
            </section>

            {/* Main Features Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group flex flex-col h-full p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 p-32 ${feature.bgColor} blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className={`h-14 w-14 rounded-2xl ${feature.bgColor} ${feature.color} flex items-center justify-center mb-6 shrink-0`}>
                                    <feature.icon className="h-7 w-7" />
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground font-medium italic">
                                        &quot;{feature.tagline}&quot;
                                    </p>
                                </div>

                                <div className="space-y-6 grow">
                                    <div>
                                        <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">What it offers</h4>
                                        <ul className="space-y-2">
                                            {feature.offers.map((offer, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                                    <span>{offer}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border/40">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-2">Why it matters</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {feature.whyItMatters}
                                    </p>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Built for Scale */}
            <section className="py-20 bg-muted/20 border-y border-border/40">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-3xl font-bold mb-12">Built for Scale & Trust</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <Globe className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="font-semibold">Security First</h3>
                            <p className="text-sm text-muted-foreground">Data protection & privacy at the core.</p>
                        </div>
                        <div className="space-y-2">
                            <Zap className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="font-semibold">Performance</h3>
                            <p className="text-sm text-muted-foreground">High-speed architecture for real-time data.</p>
                        </div>
                        <div className="space-y-2">
                            <Users className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="font-semibold">accessible</h3>
                            <p className="text-sm text-muted-foreground">Seamless experience across all devices.</p>
                        </div>
                        <div className="space-y-2">
                            <LineChart className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="font-semibold">Future Ready</h3>
                            <p className="text-sm text-muted-foreground">Expansion to mobile apps & global markets.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="py-24 text-center bg-background">
                <div className="container mx-auto px-4 max-w-3xl space-y-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Our Philosophy</h2>
                    <p className="text-2xl md:text-3xl font-medium leading-tight text-foreground">
                        We are not here to promise returns or shortcuts. <br className="hidden md:block" />
                        We are here to help people <span className="text-primary rounded-lg px-2 bg-primary/10">learn finance the right way</span>, <br className="hidden md:block" />
                        from the right people, in the right environment.
                    </p>
                </div>
            </section>

        </div>
    );
}

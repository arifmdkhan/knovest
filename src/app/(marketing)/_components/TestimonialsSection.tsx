"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const testimonials = [
    {
        name: "Rajesh Kumar",
        role: "Full-time Trader",
        content: "Consensus changed how I trade. The live rooms are invaluable for learning real-time price action.",
        avatar: "RK",
    },
    {
        name: "Sarah Jenkins",
        role: "Financial Analyst",
        content: "The quality of experts here is unmatched. Finally a place without the noise of Twitter.",
        avatar: "SJ",
    },
    {
        name: "Amit Patel",
        role: "Options Strategist",
        content: "I've grown my subscriber base by 300% since moving my content to Consensus. The tools are built for us.",
        avatar: "AP",
    },
    {
        name: "Priya Sharma",
        role: "Beginner Investor",
        content: "The courses are structured so well. I went from knowing nothing to placing my first confident trade.",
        avatar: "PS",
    },
    {
        name: "David Chen",
        role: "Crypto Analyst",
        content: "Best platform for community building. The chat features are robust and the streaming quality is top notch.",
        avatar: "DC",
    },
];

export function TestimonialsSection() {
    return (
        <section className="py-24 bg-background overflow-hidden">
            <div className="container px-4 md:px-6 mb-12 text-center">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Trusted by Serious Traders</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Join a community that values knowledge, transparency, and growth.
                </p>
            </div>

            {/* Marquee Effect */}
            <div className="relative w-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

                <div className="flex gap-6 animate-scroll whitespace-nowrap py-4 w-max hover:[animation-play-state:paused] will-change-transform">
                    {[...testimonials, ...testimonials].map((testimonial, i) => (
                        <Card key={i} className="w-[350px] shrink-0 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary">{testimonial.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold">{testimonial.name}</div>
                                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm whitespace-normal leading-relaxed">
                                    &quot;{testimonial.content}&quot;
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
        </section>
    );
}

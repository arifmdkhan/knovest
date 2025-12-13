"use client";

import { motion } from "framer-motion";
import { Users, BookOpen, TrendingUp, Award } from "lucide-react";

const stats = [
    {
        label: "Active Traders",
        value: "10k+",
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        label: "Verified Experts",
        value: "500+",
        icon: Award,
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        label: "Courses Enrolled",
        value: "25k+",
        icon: BookOpen,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
    },
    {
        label: "Trade Volume",
        value: "$100M+",
        icon: TrendingUp,
        color: "text-green-500",
        bg: "bg-green-500/10",
    },
];

export function StatsSection() {
    return (
        <section className="py-20 border-y border-border/40 bg-muted/20 backdrop-blur-sm relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{stat.value}</h3>
                            <p className="text-muted-foreground font-medium uppercase tracking-wider text-xs">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

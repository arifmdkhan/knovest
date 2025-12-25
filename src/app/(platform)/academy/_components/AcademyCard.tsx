import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AcademyCardProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    actionText: string;
    color?: "cyan" | "accent" | "default";
}

export function AcademyCard({
    href,
    icon: Icon,
    title,
    description,
    actionText,
    color = "cyan"
}: AcademyCardProps) {

    const colorStyles = {
        cyan: {
            borderHover: "hover:border-cyan-500/50",
            shadowHover: "hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)]",
            bgBlur: "bg-cyan-500/5 dark:bg-cyan-500/10 group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-500/20",
            iconBg: "bg-cyan-500/10",
            iconColor: "text-cyan-600 dark:text-cyan-500",
            titleHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-500",
            actionText: "text-cyan-600 dark:text-cyan-500"
        },
        accent: {
            borderHover: "hover:border-accent/50",
            shadowHover: "hover:shadow-[0_0_30px_-5px_var(--color-accent)]",
            bgBlur: "bg-accent/5 dark:bg-accent/10 group-hover:bg-accent/10 dark:group-hover:bg-accent/20",
            iconBg: "bg-cyan-500/10", 
            iconColor: "text-cyan-600 dark:text-cyan-500", 
            titleHover: "group-hover:text-accent-foreground dark:group-hover:text-accent",
            actionText: "text-accent-foreground dark:text-accent"
        },
        default: {
            borderHover: "hover:border-foreground/30 dark:hover:border-white/30",
            shadowHover: "hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]",
            bgBlur: "bg-foreground/5 dark:bg-white/5 group-hover:bg-foreground/10 dark:group-hover:bg-white/10", 
            iconBg: "bg-foreground/5 dark:bg-white/5",
            iconColor: "text-foreground dark:text-white",
            titleHover: "", 
            actionText: "text-foreground dark:text-white"
        }
    };

    const styles = colorStyles[color];

    return (
        <Link href={href} className="group h-full">
            <div className={cn(
                "h-full p-8 rounded-3xl bg-card/40 dark:bg-card/50 backdrop-blur-xl border border-border/50 dark:border-white/10 transition-all duration-500 hover:-translate-y-2 flex flex-col items-start justify-between gap-8 overflow-hidden relative",
                styles.borderHover,
                styles.shadowHover
            )}>
                <div className={cn(
                    "absolute top-0 right-0 p-32 rounded-full blur-3xl transition-all duration-500",
                    styles.bgBlur
                )} />

                <div className={cn(
                    "p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500",
                    styles.iconBg,
                    styles.iconColor
                )}>
                    <Icon className="w-8 h-8" />
                </div>

                <div className="space-y-2 relative z-10">
                    <h3 className={cn(
                        "text-2xl font-bold text-foreground dark:text-white transition-colors",
                        styles.titleHover
                    )}>
                        {title}
                    </h3>
                    <p className="text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className={cn(
                    "flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300",
                    styles.actionText
                )}>
                    {actionText} <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}

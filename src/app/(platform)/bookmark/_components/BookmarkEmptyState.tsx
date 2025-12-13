import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface BookmarkEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string;
}

export function BookmarkEmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionLink,
}: BookmarkEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 bg-secondary/30 rounded-2xl border border-secondary/50 shadow-sm backdrop-blur-sm">
                    <Icon className="w-10 h-10 text-primary" />
                </div>
            </div>
            
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70 mb-2">
                {title}
            </h3>
            
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                {description}
            </p>

            {actionLabel && actionLink && (
                <Link href={actionLink}>
                    <Button variant="outline" className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-primary/20 hover:border-primary/0 shadow-sm hover:shadow-primary/25">
                        {actionLabel}
                    </Button>
                </Link>
            )}
        </div>
    );
}

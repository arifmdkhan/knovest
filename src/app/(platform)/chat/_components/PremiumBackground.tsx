"use client";

import { cn } from "@/lib/utils";

interface PremiumBackgroundProps {
    className?: string;
    children?: React.ReactNode;
}

export function PremiumBackground({ className, children }: PremiumBackgroundProps) {
    return (
        <div className={cn("relative w-full h-full bg-background overflow-hidden", className)}>
            {/* 
              Performance Optimization: 
              Replaced multiple stacked divs with blur() (expensive composite) 
              with a single static radial-gradient background.
            */}
            <div
                className="absolute inset-0 opacity-40 pointer-events-none select-none"
                style={{
                    background: `
                        radial-gradient(circle at 85% 10%, var(--primary) 0%, transparent 25%),
                        radial-gradient(circle at 10% 90%, #3b82f6 0%, transparent 25%),
                        radial-gradient(circle at 50% 50%, #a855f7 0%, transparent 20%)
                    `,
                    filter: 'blur(60px)', // Single blur on one layer is much cheaper than 3 overlapping blurs
                    transform: 'translateZ(0)', // Force GPU acceleration
                }}
            />

            {/* Content - Not Clipped to allow popovers */}
            <div className="relative w-full h-full z-10">
                {children}
            </div>
        </div>
    );
}

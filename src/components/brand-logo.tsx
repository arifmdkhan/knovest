"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
// import { Command } from "lucide-react" // Removing Command icon based on user request "Brand Name 'CONSENSUS.' here color of the dot sould be different" - heavily implies text focus, but I'll keep the icon option as a prop but maybe default off or improved.
// Actually, the user asked for "Brand Name 'CONSENSUS.'". I will keep the icon as an option but the main focus is the text.
import { Command } from "lucide-react"
import { ConsensusLogo } from "./consensus-logo"

interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "large" | "small"
    showIcon?: boolean
}

export function BrandLogo({
    className,
    variant = "default",
    showIcon = true,
    ...props
}: BrandLogoProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 font-sans select-none",
                className
            )}
            {...props}
        >
            {showIcon && (
                <ConsensusLogo className="h-10 w-10 text-primary" />
                
            )}

            <div className="flex flex-col leading-none">
                <span className={cn(
                    "font-bold tracking-tight text-foreground transition-colors duration-300",
                    variant === "large" ? "text-2xl" : "text-xl"
                )}>
                    CONSENSUS
                    <span className="text-primary animate-pulse">.</span>
                </span>
            </div>
        </div>
    )
}

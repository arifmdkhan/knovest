"use client";

import { useInView } from "react-intersection-observer";
import { ReactNode } from "react";

interface LazyLoadProps {
    children: ReactNode;
    className?: string; // Class for the wrapper
    placeholderClassName?: string; // Class specifically for the placeholder state (e.g., min-height)
}

export function LazyLoad({ children, className, placeholderClassName = "min-h-[400px]" }: LazyLoadProps) {
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: "200px 0px" // Load 200px before it enters viewport
    });

    return (
        <div ref={ref} className={`${className || ""} ${!inView ? placeholderClassName : ""}`}>
            {inView ? children : null}
        </div>
    );
}

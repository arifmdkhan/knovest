"use client";

import { useEffect, useState } from "react";

export function useScrolled(threshold = 20) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;

        const updatePosition = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const isScrolled = window.scrollY > threshold;
                    setScrolled(isScrolled);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", updatePosition);
        updatePosition(); // Initial check

        return () => window.removeEventListener("scroll", updatePosition);
    }, [threshold]);

    return scrolled;
}

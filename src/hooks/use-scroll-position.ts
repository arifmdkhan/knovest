"use client";

import { useEffect, useState } from "react";

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    // Flag to prevent multiple calculations per frame
    let ticking = false;

    const updatePosition = () => {
      const currentPosition = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollPosition(currentPosition);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", updatePosition);

    // Set initial position
    updatePosition();

    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

  return scrollPosition;
}
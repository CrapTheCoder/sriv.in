"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";

export default function ScrollProgress() {
    const [progress, setProgress] = useState(0);
    const [scrollableHeight, setScrollableHeight] = useState(0);

    const updateScrollableHeight = useCallback(() => {
        if (typeof window !== "undefined") {
            const docHeight = document.documentElement.scrollHeight;
            const viewH = window.innerHeight;
            const newScrollableHeight = docHeight - viewH;
            if (newScrollableHeight > 0) {
                setScrollableHeight(newScrollableHeight);
            } else {
                setScrollableHeight(0);
            }
        }
    }, []);

    useEffect(() => {
        // Give the page more time to lay out, especially on mobile
        const timeoutId = setTimeout(updateScrollableHeight, 500);
        window.addEventListener("resize", updateScrollableHeight);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", updateScrollableHeight);
        };
    }, [updateScrollableHeight]);

    useEffect(() => {
        if (scrollableHeight <= 0) {
            setProgress(0);
            return;
        }

        const handleScroll = () => {
            const scrollY = window.scrollY;
            if (scrollY >= scrollableHeight - 2) {
                setProgress(1);
            } else {
                const raw = scrollY / scrollableHeight;
                setProgress(Math.min(Math.max(raw, 0), 1));
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        // Run once on setup
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrollableHeight]);

    if (scrollableHeight <= 0) return null;

    return (
        <div className="fixed right-2 sm:right-3 md:right-5 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div
                className="w-2 h-32 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--border)" }}
            >
                <motion.div
                    className="w-full bg-accent"
                    style={{ height: `${progress * 100}%` }}
                    transition={{ ease: "linear", duration: 0 }}
                />
            </div>
        </div>
    );
}
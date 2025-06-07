"use client";

import React, {useEffect, useRef, useState} from "react";
import {motion} from "motion/react";

type ScrollDotsProps = {
    sectionRefs: React.RefObject<HTMLDivElement | null>[];
};

export default function ScrollDots({sectionRefs}: ScrollDotsProps) {
    const [activeSection, setActiveSection] = useState(0);

    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = sectionRefs.findIndex(
                            (ref) => ref.current === entry.target
                        );
                        if (index !== -1) {
                            setActiveSection(index);
                        }
                    }
                });
            },
            {
                rootMargin: "-50% 0px -50% 0px",
                threshold: 0,
            }
        );

        const currentObserver = observerRef.current;
        sectionRefs.forEach((ref) => {
            if (ref.current) {
                currentObserver.observe(ref.current);
            }
        });

        return () => {
            if (currentObserver) {
                currentObserver.disconnect();
            }
        };
    }, [sectionRefs]);

    const scrollTo = (i: number) => {
        sectionRefs[i].current?.scrollIntoView({behavior: "smooth"});
    };

    return (
        <div
            className="fixed right-2 sm:right-3 top-1/2 -translate-y-1/2 flex flex-col items-center z-40 pointer-events-none"
        >
            {sectionRefs.map((_, idx) => {
                const isActive = idx === activeSection;
                return (
                    <motion.button
                        key={idx}
                        className="w-2 my-2 mx-auto pointer-events-auto"
                        style={{
                            backgroundColor: isActive ? "var(--accent)" : "var(--muted)",
                            borderRadius: 9999,
                            display: "block",
                            position: "relative",
                        }}
                        animate={{height: isActive ? 32 : 8}}
                        transition={{type: "spring", stiffness: 300, damping: 20}}
                        onClick={() => scrollTo(idx)}
                        aria-label={`Go to section ${idx + 1}`}
                    />
                );
            })}
        </div>
    );
}
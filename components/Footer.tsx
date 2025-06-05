"use client";

import React, {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion, useScroll} from "motion/react";
import {ChevronDown} from "lucide-react";
import {usePathname} from "next/navigation";

const LAST_SECTION_THRESHOLD = 50;
const SCROLL_STOP_DEBOUNCE_TIME = 150;
const ARROW_REAPPEAR_DELAY = 1000;

export default function Footer() {
    const pathname = usePathname();
    const isIndex = pathname === "/";

    const {scrollY} = useScroll();
    const [isScrollable, setIsScrollable] = useState(false);
    const [isAtLastSection, setIsAtLastSection] = useState(false);
    const [arrowKey, setArrowKey] = useState(0);
    const [isPageScrolling, setIsPageScrolling] = useState(false);
    const [canArrowReappear, setCanArrowReappear] = useState(true);
    const [showArrowComponent, setShowArrowComponent] = useState(false);

    const scrollStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const arrowReappearTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        const checkInitialState = () => {
            if (typeof window !== "undefined" && document.documentElement) {
                const docHeight = document.documentElement.scrollHeight;
                const viewHeight = window.innerHeight;
                const scrollable = docHeight > viewHeight + LAST_SECTION_THRESHOLD;
                setIsScrollable(scrollable);

                if (scrollable) {
                    const currentY = window.scrollY;
                    const atLast = currentY + viewHeight >= docHeight - LAST_SECTION_THRESHOLD;
                    setIsAtLastSection(atLast);
                    setCanArrowReappear(!atLast);
                } else {
                    setIsAtLastSection(true);
                    setCanArrowReappear(false);
                }
            }
        };

        const initTimeout = setTimeout(checkInitialState, 200);
        window.addEventListener("resize", checkInitialState);

        return () => {
            clearTimeout(initTimeout);
            window.removeEventListener("resize", checkInitialState);
        };
    }, [pathname]);

    useEffect(() => {
        if (!isScrollable) return;

        const checkPosition = () => {
            if (typeof window !== "undefined" && document.documentElement) {
                const currentY = scrollY.get();
                const docHeight = document.documentElement.scrollHeight;
                const viewHeight = window.innerHeight;
                setIsAtLastSection(currentY + viewHeight >= docHeight - LAST_SECTION_THRESHOLD);
            }
        };

        checkPosition();
        const unsubscribeScrollYPos = scrollY.onChange(checkPosition);

        return () => {
            unsubscribeScrollYPos();
        };
    }, [scrollY, isScrollable]);

    useEffect(() => {
        const handleScrollChange = () => {
            setIsPageScrolling(true);
            setCanArrowReappear(false);
            if (arrowReappearTimeoutRef.current) {
                clearTimeout(arrowReappearTimeoutRef.current);
            }

            if (scrollStopTimeoutRef.current) {
                clearTimeout(scrollStopTimeoutRef.current);
            }
            scrollStopTimeoutRef.current = setTimeout(() => {
                setIsPageScrolling(false);

                if (isIndex && isScrollable && !isAtLastSection) {
                    if (arrowReappearTimeoutRef.current) clearTimeout(arrowReappearTimeoutRef.current);
                    arrowReappearTimeoutRef.current = setTimeout(() => {
                        setCanArrowReappear(true);
                    }, ARROW_REAPPEAR_DELAY);
                } else {
                    setCanArrowReappear(false);
                }

            }, SCROLL_STOP_DEBOUNCE_TIME);
        };

        const unsubscribeScrollDetection = scrollY.onChange(handleScrollChange);

        return () => {
            unsubscribeScrollDetection();
            if (scrollStopTimeoutRef.current) clearTimeout(scrollStopTimeoutRef.current);
            if (arrowReappearTimeoutRef.current) clearTimeout(arrowReappearTimeoutRef.current);
        };
    }, [scrollY, isIndex, isScrollable, isAtLastSection]);

    useEffect(() => {
        const shouldShow = isIndex && isScrollable && !isAtLastSection && !isPageScrolling && canArrowReappear;
        const wasShowing = showArrowComponent;
        setShowArrowComponent(shouldShow);

        if (shouldShow && !wasShowing) {
            setArrowKey(prev => prev + 1);
        }
    }, [isIndex, isScrollable, isAtLastSection, isPageScrolling, canArrowReappear, showArrowComponent]);


    const handleScrollDown = () => {
        if (!showArrowComponent) return;

        window.scrollBy({
            top: window.innerHeight * 0.9,
            behavior: "smooth",
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleScrollDown();
        }
    };

    const arrowVariants = {
        hidden: {y: "100%", opacity: 0, transition: {duration: 0, ease: "easeIn"}},
        visible: {y: 0, opacity: 1, transition: {duration: 0.3, ease: "easeOut"}},
    };

    return (
        <div className="relative flex justify-center pointer-events-none">
            <AnimatePresence>
                {showArrowComponent && (
                    <motion.div
                        key={`arrow-motion-container-${arrowKey}`}
                        className={`
                            fixed bottom-[10px] flex justify-center w-fit
                            text-yellow-200 drop-shadow-sm drop-shadow-yellow-50
                            pointer-events-auto
                        `}
                        variants={arrowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={handleScrollDown}
                        onKeyDown={handleKeyDown}
                        role="button"
                        tabIndex={0}
                        aria-label="Scroll to next section"
                    >
                        <ChevronDown
                            className="flex items-center animate-bounce"
                            size={48}
                            aria-hidden="true"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Terminal} from "lucide-react";
import {motion, useMotionValueEvent, useScroll} from "motion/react";
import Link from "next/link";
import HeaderLinks from "./HeaderLinks";
import {useCustomCursor} from "./providers/CustomCursorProvider";

const Logo = ({
                  isScrolled,
                  animationDuration,
                  formationDelayDuration,
              }: {
    isScrolled: boolean;
    animationDuration: number;
    formationDelayDuration: number;
}) => {
    return (
        <Link
            data-cursor-generic
            href="/"
            className="flex items-center gap-x-0 sm:gap-x-1 ml-3 rounded-xl px-2 pointer-events-auto"
        >
            <motion.div
                className=""
                initial={false}
                animate={{
                    width: isScrolled
                        ? "var(--logo-icon-width-scrolled)"
                        : "var(--logo-icon-width-not-scrolled)",
                    height: isScrolled
                        ? "var(--logo-icon-height-scrolled)"
                        : "var(--logo-icon-height-not-scrolled)",
                }}
                transition={{
                    duration: animationDuration,
                    delay: formationDelayDuration,
                }}
            >
                <Terminal className="w-full h-full"/>
            </motion.div>

            <motion.h2
                data-text-cursor
                className="font-bold text-[var(--logo-text-size-not-scrolled)] select-none"
                initial={false}
                animate={{
                    fontSize: isScrolled
                        ? "var(--logo-text-size-scrolled)"
                        : "var(--logo-text-size-not-scrolled)",
                }}
                transition={{
                    duration: animationDuration,
                    delay: formationDelayDuration,
                }}
            >
                sriv
            </motion.h2>
        </Link>
    );
};

export default function Header() {
    const {isCursorVisible: isDesktop} = useCustomCursor();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    const [isScrolled, setIsScrolled] = useState(false);
    const {scrollY} = useScroll();

    const handleScroll = useCallback((latest: number) => {
        setIsScrolled(latest > 40);
    }, []);

    useMotionValueEvent(scrollY, "change", handleScroll);

    const animationDuration = 0.06;
    const effectDelayDuration = isScrolled ? 0.1 : 0;
    const formationDelayDuration = isScrolled ? 0 : 0.1;

    const transition = useMemo(
        () => ({
            type: "tween",
            ease: "easeInOut",
            delay: formationDelayDuration,
            boxShadow: {
                duration: animationDuration,
                delay: effectDelayDuration,
            },
            backgroundColor: {
                delay: effectDelayDuration,
                duration: animationDuration,
            },
        }),
        [formationDelayDuration, effectDelayDuration]
    );

    const getAnimateProps = () => {
        const commonProps = {
            width: isScrolled ? (isMobile ? "95%" : "80%") : "100%",
            borderRadius: isScrolled ? "70px" : "0px",
            boxShadow: "0px 0px 0px var(--shadow)",
        };

        if (!isDesktop) {
            return {
                ...commonProps,
                backgroundColor: isScrolled ? 'hsl(0 0% 5% / 0.75)' : 'var(--fully-transparent)',
                backdropFilter: 'blur(0rem)',
            };
        }

        return {
            ...commonProps,
            backgroundColor: "var(--fully-transparent)",
            backdropFilter: isScrolled ? "blur(3rem)" : "blur(0rem)",
        };
    };

    return (
        <div className="relative w-full">
            <motion.header
                className="fixed top-0 left-0 right-0 z-50 mx-auto py-1 sm:py-1.5 translate-y-[8px] sm:translate-y-[10px]"
                initial={false}
                animate={getAnimateProps()}
                transition={transition}
                style={{
                    left: "50%",
                    x: "-50%",
                    willChange:
                        "padding, width, borderRadius, boxShadow, backgroundColor, backdropFilter",
                }}
            >
                <motion.div
                    className="absolute inset-0 ring-[1px] ring-border rounded-[inherit]"
                    initial={false}
                    animate={{
                        opacity: isScrolled ? 0.1 : 0,
                    }}
                    transition={{
                        duration: animationDuration,
                        delay: effectDelayDuration,
                    }}
                />

                <div className="relative z-10 flex items-center text-yellow-200 text-shadow-lg/90">
                    <div className="flex basis-0 flex-1 items-center gap-x-[.1rem]">
                        <Logo
                            isScrolled={isScrolled}
                            animationDuration={animationDuration}
                            formationDelayDuration={formationDelayDuration}
                        />
                    </div>

                    <div className="flex basis-0 justify-end items-center pr-3 sm:pr-7 pointer-events-auto">
                        <HeaderLinks
                            isScrolled={isScrolled}
                            animationDuration={animationDuration}
                            formationDelayDuration={formationDelayDuration}
                        />
                    </div>
                </div>
            </motion.header>
        </div>
    );
}

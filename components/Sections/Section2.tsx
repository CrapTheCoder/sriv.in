"use client";

import Section from "./Section";
import Experience from "../Experience";
import AboutMe from "../AboutMe";
import Education from "../Education";
import {DisplayLanguages, DisplayTechnologies} from "../Skills";
import {SlideFadeIn} from "../SlideFadeIn";
import {useEffect, useState} from "react";
import { useCustomCursor } from "@/components/providers/CustomCursorProvider";
import { cn } from "@/lib/utils";

type SectionProps = {
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
};

const Section2 = ({className = "", ref}: SectionProps) => {
    const { isCursorVisible: isDesktop } = useCustomCursor();
    const [direction, setDirection] = useState<"left" | "right">("left");
    useEffect(() => {
        const updateDirection = () => {
            setDirection(window.innerWidth >= 768 ? "right" : "left");
        };

        updateDirection();
        window.addEventListener("resize", updateDirection);
        return () => window.removeEventListener("resize", updateDirection);
    }, []);

    return (
        <Section className={`${className}`} ref={ref} sectionName="About">
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center py-12 md:py-20 px-4 md:px-8">
                <div
                    className={cn(
                        "w-full max-w-[90rem]",
                        "mx-auto",
                        "py-8 md:py-12",
                        "px-8 sm:px-12 md:px-16",
                        isDesktop ? "backdrop-blur-[3rem]" : "bg-background/80",
                        "rounded-[70px]",
                        "shadow-2xl",
                        "pointer-events-auto"
                    )}
                >
                    <div className="w-full">
                        <div
                            className="flex flex-col md:flex-row justify-center gap-x-10 lg:gap-x-16 md:pt-12 md:items-start overflow-hidden">
                            <div className="flex flex-col items-center md:items-start gap-y-4 md:w-1/2 mb-4 md:mb-0">
                                <Experience/>
                            </div>
                            <div className="flex flex-col items-center md:items-start gap-y-4 md:w-1/2 md:mb-0">
                                <Education/>
                                <AboutMe/>
                            </div>
                        </div>

                        <div
                            className="flex flex-col md:flex-row justify-center gap-x-10 lg:gap-x-16 pt-8 md:pt-12 md:items-start overflow-hidden">
                            <div className="flex flex-col items-center w-full gap-y-4 md:w-1/2 md:mb-0">
                                {direction === "right" && (
                                    <SlideFadeIn>
                                        <DisplayLanguages/>
                                    </SlideFadeIn>
                                )}
                                {direction === "left" && <div className="hidden md:block min-h-[1px]"></div>}
                            </div>

                            <div className="flex flex-col items-center w-full gap-y-4 md:w-1/2 md:mb-0">
                                {direction === "left" && (
                                    <SlideFadeIn>
                                        <DisplayLanguages/>
                                    </SlideFadeIn>
                                )}
                                <SlideFadeIn direction={direction}> {}
                                    <DisplayTechnologies/>
                                </SlideFadeIn>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
};

export default Section2;

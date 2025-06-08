"use client";

import Section from "./Section";
import SocialLinks from "../SocialLinks";
import {SlideFadeIn} from "../SlideFadeIn";
import {useCustomCursor} from "@/components/providers/CustomCursorProvider";

type SectionProps = {
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
};

const SubText = () => {
    return (
        <div
            className="flex items-center justify-center z-50 pointer-events-auto"
            data-text-cursor
        >
            <div
                className="whitespace-nowrap text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl"
            >
                <div className="flex gap-x-3">
                    <SlideFadeIn slideOffset={20} delay={0.12}>Competitive Programmer</SlideFadeIn>
                    <SlideFadeIn slideOffset={20} delay={0.06}>|</SlideFadeIn>
                    <SlideFadeIn slideOffset={20}>AI @IITGN</SlideFadeIn>
                </div>
            </div>
        </div>
    );
};

const Section1 = ({className = "", ref}: SectionProps) => {
    const {isCursorVisible: isDesktop} = useCustomCursor();
    return (
        <Section className={`${className}`} ref={ref}>
            <div className="relative z-10 flex flex-col justify-center items-center align-middle text-shadow-lg/100 text-yellow-200">
                <h1
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-9xl font-bold font-header tracking-[.1rem] flex gap-x-2 md:gap-x-3 xl:gap-x-4 pointer-events-auto"
                    data-text-cursor
                >
                    <SlideFadeIn delay={0.12}>Srivaths</SlideFadeIn>
                    <SlideFadeIn delay={0.06}>P</SlideFadeIn>
                </h1>

                <SubText/>
                <SocialLinks className="pointer-events-auto"/>
            </div>
        </Section>
    );
};

export default Section1;

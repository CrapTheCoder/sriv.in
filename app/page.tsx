"use client";

import React, {useRef} from "react";
import Section1 from "@/components/Sections/Section1";
import Section2 from "@/components/Sections/Section2";
import Section3 from "@/components/Sections/Section3";
import ScrollDots from "@/components/ScrollDots";

export default function Home() {
    const sectionRefs = [
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
    ];

    return (
        <>
            <Section1 ref={sectionRefs[0]}/>
            <Section2 ref={sectionRefs[1]}/>
            <Section3 ref={sectionRefs[2]}/>
            <ScrollDots sectionRefs={sectionRefs}/>
        </>
    );
}

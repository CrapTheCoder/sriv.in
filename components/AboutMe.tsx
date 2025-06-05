"use client";

import {SlideFadeIn} from "./SlideFadeIn";
import React, {useEffect, useState} from "react";

const AboutMe = () => {
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
        <div className="flex flex-col w-full">
            <h2
                className="text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-header text-center"
                data-text-cursor
            >
                About Me
            </h2>

            <div
                className="mt-0 sm:mt-1 px-2 w-95 sm:w-120 md:w-83 lg:w-100 xl:w-150 text-sm sm:text-base md:text-base lg:text-lg 2xl:text-xl">
                <SlideFadeIn direction={direction} inMargin="-100px" outMargin="-80px">
                    <p data-text-cursor className="w-fit">
                        I&apos;m a competitive programmer interested in Algorithms, Compilers, OS, Networks, and AI/ML.
                    </p>
                </SlideFadeIn>
                <br/>
                <SlideFadeIn direction={direction} inMargin="-100px" outMargin="-80px">
                    <p data-text-cursor className="w-fit">
                        I enjoy solving complex problems, figuring out heuristics, and optimizing solutions.
                    </p>
                </SlideFadeIn>
                <br/>
                <SlideFadeIn direction={direction} inMargin="-100px" outMargin="-80px">
                    <p data-text-cursor className="w-fit">
                        I am a 2x IOITCer, Rated 1998 in CodeForces and 2148 in CodeChef. I have built projects such as
                        a Lightweight Online Judge and a Chess Engine.
                    </p>
                </SlideFadeIn>
            </div>
        </div>
    );
};

export default AboutMe;

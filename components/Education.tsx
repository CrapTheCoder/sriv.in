"use client";
import Image from "next/image";
import React, {useEffect, useState} from "react";
import {SlideFadeIn} from "./SlideFadeIn";
import Link from "next/link";

const UniversityLogo = ({
                            url,
                            logoPath,
                            size,
                        }: {
    url: string;
    logoPath: string;
    size: string;
}) => {
    return (
        <a href={url} target="_blank">
            <div
                className={`${size} flex items-center justify-center hover:scale-95 transition-transform duration-200`}
            >
                <Image
                    src={logoPath}
                    alt="University Logo"
                    height={80}
                    width={80}
                    unoptimized
                    className="select-none rounded"
                />
            </div>
        </a>
    );
};

const universities = [
    {
        name: "Indian Institute of Technology, Gandhinagar",
        details: "2023 - 2027 | 8.76 CPI",
        college: "College of Engineering",
        site: "https://iitgn.ac.in/",
        logoPath: "/university-logos/iitgn-logo.png",
        degree: "B.Tech in AI | Minor in Computer Science",
        size: "size-10 sm:size-10 md:size-17",
    },
];

const Education = () => {
    const [direction, setDirection] = useState<"left" | "right">("left");
    useEffect(() => {
        const updateDirection = () => {
            setDirection(window.innerWidth >= 768 ? "right" : "left");
        };

        updateDirection(); // initial check
        window.addEventListener("resize", updateDirection);
        return () => window.removeEventListener("resize", updateDirection);
    }, []);

    return (
        <div className="flex flex-col w-full">
            <h2
                className="text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-header text-center"
                data-text-cursor
            >
                Education
            </h2>
            <div className="mt-0 sm:mt-1">
                {universities.map((university) => (
                    <SlideFadeIn key={university.name} direction={direction}>
                        <div
                            className="flex items-center gap-x-3 py-1"
                            data-cursor-generic-padded='{"left": 10, "right":10}'
                            data-cursor-subcursor
                        >
                            <div
                                className={`flex-shrink-0 size-12 sm:size-14 md:size-18 flex items-center justify-center`}
                            >
                                <UniversityLogo
                                    url={university.site}
                                    logoPath={university.logoPath}
                                    size={university.size}
                                />
                            </div>
                            <div>
                                <Link
                                    className="font-semibold text-base sm:text-xl md:text-xl break-words underline-fade leading-0 hover:text-primary w-fit"
                                    href={university.site}
                                    target="_blank"
                                    data-text-cursor
                                >
                                    {university.name}
                                </Link>
                                <h3 className="text-xs w-fit" data-text-cursor>
                                    {university.details}
                                </h3>
                                <h3
                                    className="text-xs sm:text-base md:text-sm xl:text-base text-muted w-fit"
                                    data-text-cursor
                                >
                                    {university.degree}
                                </h3>
                            </div>
                        </div>
                    </SlideFadeIn>
                ))}
            </div>
        </div>
    );
};

export default Education;

"use client";

import React from "react";
import Image from "next/image";
import {SlideFadeIn} from "./SlideFadeIn";
import Link from "next/link";

const CompanyLogo = ({
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
                    alt="Company Logo"
                    height={80}
                    width={80}
                    unoptimized
                    className="select-none"
                />
            </div>
        </a>
    );
};

const companies = [
    {
        name: "WorldQuant – Research",
        site: "https://www.worldquant.com/",
        logoPath: "/company-logos/worldquant-logo.png",
        position: "Quantitative Research Consultant",
        size: "size-10 sm:size-10 md:size-17",
    },
];

const Experience = () => {
    return (
        <div className="flex flex-col w-full">
            <h2
                className="text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-header text-center"
                data-text-cursor
            >
                Experience
            </h2>
            <div className="mt-0 sm:mt-1 space-y-[-3px] sm:space-y-0">
                {companies.map((company) => (
                    <SlideFadeIn key={company.name}>
                        <div
                            className="flex items-center gap-x-3"
                            data-cursor-generic-padded='{"left": 10, "right":10}'
                            data-cursor-subcursor
                        >
                            <div
                                className={`flex-shrink-0 size-12 sm:size-14 md:size-18 flex items-center justify-center`}
                            >
                                <CompanyLogo
                                    url={company.site}
                                    logoPath={company.logoPath}
                                    size={company.size}
                                />
                            </div>
                            <div>
                                <Link
                                    className="font-semibold text-base sm:text-xl md:text-xl xl:text-2xl break-words underline-fade leading-0 hover:text-primary w-fit"
                                    href={company.site}
                                    target="_blank"
                                    data-text-cursor
                                >
                                    {company.name}
                                </Link>
                                <h3
                                    className="text-xs sm:text-base md:text-sm xl:text-base text-muted w-fit"
                                    data-text-cursor
                                >
                                    {company.position}
                                </h3>
                            </div>
                        </div>
                    </SlideFadeIn>
                ))}
            </div>
        </div>
    );
};

export default Experience;

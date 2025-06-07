"use client";

import React from "react";
import Image from "next/image";
import {SlideFadeIn} from "./SlideFadeIn";
import Link from "next/link";

const WebsiteLogo = ({
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
                    alt="Website Logo"
                    height={80}
                    width={80}
                    unoptimized
                    className="select-none"
                />
            </div>
        </a>
    );
};

const profiles = [
    {
        name: "CodeForces \u2014 Candidate Master",
        site: "https://codeforces.com/profile/crap_the_coder",
        logoPath: "/website-logos/codeforces-logo.svg",
        description: "India Rank ~130 | Global Rank ~3300",
        size: "size-10 sm:size-10 md:size-17",
    },
    {
        name: "CodeChef \u2014 Five Star",
        site: "https://www.codechef.com/users/crap_the_coder",
        logoPath: "/website-logos/codechef-logo.jpg",
        description: "India Rank ~309 | Global Rank ~681",
        size: "size-10 sm:size-10 md:size-17",
    },
];

const Profiles = () => {
    return (
        <div className="flex flex-col w-full">
            <h2
                className="text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-6xl font-header text-center"
                data-text-cursor
            >
                Profiles
            </h2>
            <div className="mt-0 sm:mt-1 space-y-[-3px] sm:space-y-0">
                {profiles.map((profile) => (
                    <SlideFadeIn key={profile.name}>
                        <div
                            className="flex items-center gap-x-3"
                            data-cursor-generic-padded='{"left": 10, "right":10}'
                            data-cursor-subcursor
                        >
                            <div
                                className={`flex-shrink-0 size-12 sm:size-14 md:size-18 flex items-center justify-center`}
                            >
                                <WebsiteLogo
                                    url={profile.site}
                                    logoPath={profile.logoPath}
                                    size={profile.size}
                                />
                            </div>
                            <div>
                                <Link
                                    className="font-semibold text-base sm:text-xl md:text-xl xl:text-2xl break-words underline-fade leading-0 hover:text-primary w-fit"
                                    href={profile.site}
                                    target="_blank"
                                    data-text-cursor
                                >
                                    {profile.name}
                                </Link>
                                <h3
                                    className="text-xs sm:text-base md:text-sm xl:text-base text-muted w-fit"
                                    data-text-cursor
                                >
                                    {profile.description}
                                </h3>
                            </div>
                        </div>
                    </SlideFadeIn>
                ))}
            </div>
        </div>
    );
};

export default Profiles;

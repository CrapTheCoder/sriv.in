"use client";

import React, {useState} from "react";
import {FileUser, Github, Linkedin, Mail} from "lucide-react";
import {SlideFadeIn} from "./SlideFadeIn";
import Link from "next/link";

const socials = [
    {
        name: "GitHub",
        icon: Github,
        link: "https://github.com/crapthecoder",
    },
    {
        name: "Email",
        icon: Mail,
        link: "mailto:srivathspradeep@gmail.com",
    },
    {
        name: "LinkedIn",
        icon: Linkedin,
        link: "https://www.linkedin.com/in/srivaths-p/",
    },
    {
        name: "Resume",
        icon: FileUser,
        link: "/resume/Srivaths_Resume_May_2025.pdf",
    },
] as const;

type Social = (typeof socials)[number];

const SocialLinkItem = ({name, icon: Icon, link}: Social) => {
    const [hovered, setHovered] = useState(false);
    const isEmail = name === "Email" && link.startsWith("mailto:");
    const isResume = name === "Resume";


    return (
        <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-tooltip-hover={hovered}
            data-tooltip-name={name}
        >
            <Link
                href={link}
                target={!isEmail && !isResume ? "_blank" : undefined}
                rel={!isEmail && !isResume ? "noopener noreferrer" : undefined}
                aria-label={name}
                className="z-50"
            >
                <Icon
                    className="size-5 md:size-6 xl:size-8 hover:scale-115 hover:rotate-1 transition-transform duration-290 drop-shadow-lg/100"/>
            </Link>
        </div>
    );
};

const SocialLinks = ({className}: { className?: string }) => {
    return (
        <div className={`mt-2 lg:mt-3 xl:mt-4 flex gap-x-6 sm:gap-x-8 ${className || ''}`}>
            {socials.map((social, index) => (
                <SlideFadeIn
                    key={social.name}
                    slideOffset={20}
                    delay={(socials.length - index) * 0.06}
                >
                    <SocialLinkItem {...social} />
                </SlideFadeIn>
            ))}
        </div>
    );
};

export default SocialLinks;
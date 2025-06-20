"use client";

import React, {useState, useRef, useEffect} from "react";
import {FileUser, Github, Linkedin, Mail, Youtube, Phone} from "lucide-react";
import {SlideFadeIn} from "./SlideFadeIn";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const socials = [
    {
        name: "LinkedIn",
        icon: Linkedin,
        link: "https://www.linkedin.com/in/srivaths-p/",
    },
    {
        name: "Youtube",
        icon: Youtube,
        link: "https://www.youtube.com/@sriv",
    },
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
        name: "Resume",
        icon: FileUser,
        link: "https://drive.google.com/file/d/1LSMxaMtS34-ipmhPB29S3lFd-j2yKN7f/view?usp=drive_link",
    },
    {
        name: "Phone",
        icon: Phone,
        link: "+91-7010655082",
    },
] as const;

type Social = (typeof socials)[number];

const SocialLinkItem = ({name, icon: Icon, link}: Social) => {
    const [hovered, setHovered] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isEmail = name === "Email" && link.startsWith("mailto:");

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    if (name === "Phone") {
        const handleCopy = () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            navigator.clipboard.writeText(link).then(() => {
                setIsCopied(true);
                copyTimeoutRef.current = setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        };

        return (
            <div
                className="relative flex justify-center cursor-pointer"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                role="button"
                aria-label="Copy phone number"
            >
                <Icon
                    className="size-5 md:size-6 xl:size-8 hover:scale-115 transition-transform duration-290 drop-shadow-lg/100" onClick={handleCopy}/>

                <AnimatePresence>
                    {(hovered || isCopied) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full mt-1 whitespace-nowrap bg-background border border-border px-3 py-1 rounded-3xl shadow-lg text-base font-semibold text-yellow-100"
                        >
                            {isCopied ? "Copied!" : link}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

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
                target={!isEmail ? "_blank" : undefined}
                rel={!isEmail ? "noopener noreferrer" : undefined}
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
"use client";

import React from "react";
import {SlideFadeIn} from "@/components/SlideFadeIn";
import {Github, Link as LinkIcon} from "lucide-react";
import Link from "next/link";
import SmallTextPills from "@/components/SmallTextPills";
import Section from "./Section";
import {useCustomCursor} from "../providers/CustomCursorProvider";
import {cn} from "@/lib/utils";

interface MonthYear {
    month: number;
    year: number;
}

type ProjectDate =
    | MonthYear
    | "Present"
    | { start: MonthYear; end: MonthYear | "Present" };

type Project = {
    title: string;
    shortDescription: React.ReactNode;
    longDescription?: string;
    tags: string[];
    date?: ProjectDate;
    link?: string;
    github?: string;
};

const projects: Project[] = [
    {
        title: "This Website",
        shortDescription: "Personal portfolio.",
        tags: ["Next.js", "Tailwind CSS", "TypeScript", "Framer Motion/motion.dev"],
        link: "/",
        date: {start: {month: 6, year: 2025}, end: "Present"},
        github: "https://github.com/CrapTheCoder/sriv.in/",
    },
    {
        title: "Dockerless Online Judge",
        shortDescription: "Automated C++/C/Python code evaluator for IITGN courses using FastAPI & systemd sandboxing.",
        tags: ["FastAPI", "Jinja2", "SQLite", "systemd", "bwrap", "Python", "C++", "Gunicorn", "Nginx"],
        date: {month: 5, year: 2025},
        link: "https://doj.sriv.in/",
        github: "https://github.com/CrapTheCoder/Dockerless-Online-Judge",
    },
    {
        title: "Fault Tolerant Oracles",
        shortDescription: "Research on efficient shortest-path queries under single-edge failures. Placed first in IITGN's Undergraduate Research Showcase.",
        tags: ["Graph Theory", "Algorithms", "Data Structures", "Research"],
        date: {
            start: {month: 1, year: 2024},
            end: {month: 4, year: 2024}
        },
        link: "https://drive.google.com/drive/folders/12y9piflG3To4-gQN74p_70tQQPHyBbBw",
    },
    {
        title: "Board Game Engines",
        shortDescription: "High-performance Chess (Python) & Game of Y (C++) engines using Negamax, transposition tables, PV-Search, and other heuristics.",
        tags: ["Python", "C++", "AI", "Game Development", "Search Algorithms", "Optimization"],
        github: "https://github.com/CrapTheCoder/BoardGameEngines",
    }
];

const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
];

function formatMonthYear(d: MonthYear): string {
    const name = monthNames[d.month - 1] || "";
    return `${name} ${d.year}`;
}

function formatProjectDate(date: ProjectDate): string {
    if (date === "Present") {
        return "Present";
    }
    if (typeof date === "object" && "start" in date) {
        const {start, end} = date;

        if (end !== "Present" && end.year === start.year) {
            const startName = monthNames[start.month - 1] || "";
            const endName = monthNames[(end as MonthYear).month - 1] || "";
            return `${startName} — ${endName} ${start.year}`;
        }

        const startStr = formatMonthYear(start);
        const endStr =
            end === "Present" ? "Present" : formatMonthYear(end as MonthYear);
        return `${startStr} — ${endStr}`;
    }

    return formatMonthYear(date as MonthYear);
}

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({project}) => {
    const {title, shortDescription, date, github, link, tags} = project;

    return (
        <div
            className="w-full h-full relative flex flex-col bg-background border border-border rounded-lg shadow-shadow_c shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out"
            data-cursor-generic
            data-cursor-subcursor
        >
            <div className="flex flex-col flex-grow p-4">
                <div className="flex justify-between items-start mb-1">
                    <h2
                        className="text-lg lg:text-xl font-bold text-foreground"
                        data-text-cursor
                    >
                        {title}
                    </h2>
                    <div className="flex space-x-3">
                        {link && (
                            <Link
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${title} - Live Preview`}
                            >
                                <LinkIcon
                                    className="w-6 h-6 text-muted hover:text-primary transition-colors duration-200"/>
                            </Link>
                        )}
                        {github && (
                            <Link
                                href={github}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${title} - GitHub Repository`}
                            >
                                <Github
                                    className="w-6 h-6 text-muted hover:text-primary transition-colors duration-200"/>
                            </Link>
                        )}
                    </div>
                </div>
                {date && (
                    <p
                        className="text-xs text-muted-foreground mb-2 w-fit"
                        data-text-cursor
                    >
                        {formatProjectDate(date)}
                    </p>
                )}
                <p
                    className="text-sm text-foreground mb-4 line-clamp-4 flex-grow w-fit"
                    data-text-cursor
                >
                    {shortDescription}
                </p>
                <SmallTextPills pills={tags} subcursor={true}/>
            </div>
        </div>
    );
};

type SectionProps = {
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
};

const Section3 = ({className = "", ref}: SectionProps) => {
    const {isCursorVisible: isDesktop} = useCustomCursor();
    return (
        <Section className={`${className}`} ref={ref} sectionName="Projects">
            <div
                className="relative z-10 w-full h-full flex flex-col justify-center items-center py-12 md:py-20 px-4 md:px-8 pointer-events-none">
                <div
                    className={cn(
                        "w-fit",
                        "mx-auto",
                        "py-8 md:py-12",
                        "px-8 sm:px-12 md:px-16",
                        isDesktop ? "backdrop-blur-[3rem]" : "bg-background/80",
                        "rounded-[70px]",
                        "shadow-2xl",
                    )}
                >
                    <h1
                        className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-header tracking-[.1rem] pointer-events-auto text-center"
                        data-text-cursor
                    >
                        Projects
                    </h1>

                    <div
                        className="w-full mt-8 max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 pointer-events-auto">
                        {projects.map((project, idx) => (
                            <SlideFadeIn
                                key={idx}
                                delay={idx * 0.02}
                                duration={0.3}
                                slideOffset={20}
                            >
                                <ProjectCard project={project}/>
                            </SlideFadeIn>
                        ))}
                    </div>
                    <div className="h-20 block md:hidden"/>
                </div>
            </div>
        </Section>
    );
}

export default Section3;

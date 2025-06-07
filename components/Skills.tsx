import React from "react";
import SmallTextPills from "./SmallTextPills";

type skills = string[];

const languages: skills = [
    "C/C++",
    "Python",
    "Rust",
    "JavaScript",
    "Typescript",
    "Java",
    "Kotlin"
];

const technologies: skills = [
    "Next.js/React.js",
    "FastAPI",
    "Flask",
    "Django",
    "Linux",
    "PyTorch",
    "Numpy",
    "Pandas",
    "SQLite",
    "Git"
];

export const DisplayLanguages = () => {
    return (
        <div className="flex flex-col items-center px-3 w-full">
            <h3 className="font-header text-3xl" data-text-cursor>
                Languages
            </h3>
            <SmallTextPills pills={languages} centered/>
        </div>
    );
};

export const DisplayTechnologies = () => {
    return (
        <div className="flex flex-col items-center px-3 w-full">
            <h3 className="font-header text-3xl" data-text-cursor>
                Technologies
            </h3>
            <SmallTextPills pills={technologies} centered/>
        </div>
    );
};

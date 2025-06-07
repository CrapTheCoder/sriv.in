import React from "react";

type SectionProps = {
    children: React.ReactNode;
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
    sectionName?: string;
};

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
    ({
         className = "",
         children,
         sectionName = "NAME NOT PROVIDED",
     }, ref) => {
        return (
            <div
                ref={ref}
                data-section-name={sectionName}
                className={`relative min-h-screen flex flex-col justify-center items-center snap-none sm:snap-start ${className}`}
            >
                {children}
            </div>
        );
    }
);

Section.displayName = "Section";

export default Section;
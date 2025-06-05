"use client";

import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,} from "react";

interface CustomCursorContextType {
    isCursorVisible: boolean;
    customCursorNoneTW: string;
    sectionRef: React.RefObject<HTMLDivElement | null>;
}

const CustomCursorContext = createContext<CustomCursorContextType | undefined>(
    undefined
);

interface DebouncedFunction<T extends (...args: unknown[]) => void> {
    cancel: () => void;

    (...args: Parameters<T>): void;
}

const debounce = <T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): DebouncedFunction<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const debouncedFn = (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };

    debouncedFn.cancel = () => {
        clearTimeout(timeoutId);
    };

    return debouncedFn;
};

export function CustomCursorProvider({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const [isDesktop, setIsDesktop] = useState(true);
    const sectionRef = useRef<HTMLDivElement | null>(null);

    const checkDevice = useCallback(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice =
            /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
                userAgent
            );
        setIsDesktop(!isMobileDevice);
    }, []);

    const debouncedCheckDevice = useMemo(
        () => debounce(checkDevice, 100),
        [checkDevice]
    );

    useEffect(() => {
        checkDevice();
        window.addEventListener("resize", debouncedCheckDevice, {passive: true});
        return () => {
            window.removeEventListener("resize", debouncedCheckDevice);
            debouncedCheckDevice.cancel();
        };
    }, [checkDevice, debouncedCheckDevice]);

    const isCursorVisible = useMemo(() => isDesktop, [isDesktop]);

    const customCursorNoneTW = useMemo(
        () => (isCursorVisible ? "cursor-none" : ""),
        [isCursorVisible]
    );

    const contextValue = useMemo(
        () => ({
            isCursorVisible,
            customCursorNoneTW,
            sectionRef,
        }),
        [isCursorVisible, customCursorNoneTW]
    );

    return (
        <CustomCursorContext.Provider value={contextValue}>
            {children}
        </CustomCursorContext.Provider>
    );
}

export const useCustomCursor = (() => {
    const context = useContext(CustomCursorContext);
    if (context === undefined) {
        throw new Error(
            "useCustomCursor must be used within a CustomCursorProvider"
        );
    }
    return context;
}) as () => CustomCursorContextType;

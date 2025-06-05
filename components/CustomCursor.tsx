"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState,} from "react";
import {motion, useSpring} from "motion/react";
import {useCustomCursor} from "./providers/CustomCursorProvider";
import {GlowEffect} from "./motion-primitives/glow-effect";

const useDebounce = <T extends (...args: unknown[]) => void>(
    callback: T,
    delay: number
) => {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );
};

const CustomCursor: React.FC = () => {
    const {isCursorVisible} = useCustomCursor();
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});
    const [isClickable, setIsClickable] = useState(false);
    const [isOverText, setIsOverText] = useState(false);
    const [textHeight, setTextHeight] = useState(0);
    const [hoveredTooltip, setHoveredTooltip] = useState<{
        name: string;
        hovered: boolean;
    } | null>(null);
    const [textWidth, setTextWidth] = useState(0);
    const [headerLinkRect, setHeaderLinkRect] = useState<DOMRect | null>(null);
    const [genericHoverRect, setGenericHoverRect] = useState<DOMRect | null>(
        null
    );
    const [genericBorderRadius, setGenericBorderRadius] = useState<number>(15);
    const [isOverSubcursor, setIsOverSubcursor] = useState(false);
    const [isSubcursorOverText, setIsSubcursorOverText] = useState(false);
    const [cursorOpacity, setCursorOpacity] = useState(0.75);
    const [subcursorOpacity, setSubcursorOpacity] = useState(0.1);
    const [subcursorGenericRect, setSubcursorGenericRect] =
        useState<DOMRect | null>(null);
    const [subcursorGenericBorderRadius, setSubcursorGenericBorderRadius] =
        useState<number>(15);

    const tempSpanRef = useRef<HTMLSpanElement | null>(null);

    const springConfig = {stiffness: 800, damping: 25, mass: 0.1};
    const x = useSpring(mousePosition.x, {...springConfig, mass: 0.001});
    const y = useSpring(mousePosition.y, {...springConfig, mass: 0.001});
    const scale = useSpring(1, {stiffness: 1000, damping: 30, mass: 0.05});
    const subcursorScale = useSpring(1, {
        stiffness: 1000,
        damping: 30,
        mass: 0.05,
    });
    const subcursorX = useSpring(mousePosition.x, {
        ...springConfig,
        mass: 0.001,
    });
    const subcursorY = useSpring(mousePosition.y, {
        ...springConfig,
        mass: 0.001,
    });

    useEffect(() => {
        if (!isCursorVisible) return;
        if (headerLinkRect) {
            const targetX = headerLinkRect.left + headerLinkRect.width / 2;
            const targetY = headerLinkRect.top + headerLinkRect.height / 2;
            x.set(targetX);
            y.set(targetY);
        } else if (genericHoverRect) {
            const targetX = genericHoverRect.left + genericHoverRect.width / 2;
            const targetY = genericHoverRect.top + genericHoverRect.height / 2;
            x.set(targetX);
            y.set(targetY);
        } else {
            x.set(mousePosition.x);
            y.set(mousePosition.y);
        }

        if (subcursorGenericRect) {
            const targetX =
                subcursorGenericRect.left + subcursorGenericRect.width / 2;
            const targetY =
                subcursorGenericRect.top + subcursorGenericRect.height / 2;
            subcursorX.set(targetX);
            subcursorY.set(targetY);
        } else {
            subcursorX.set(mousePosition.x);
            subcursorY.set(mousePosition.y);
        }
    }, [
        mousePosition,
        headerLinkRect,
        genericHoverRect,
        subcursorGenericRect,
        x,
        y,
        subcursorX,
        subcursorY,
        isCursorVisible,
    ]);

    useEffect(() => {
        if (!isCursorVisible) return;
        let timeoutId: NodeJS.Timeout;

        const blink = () => {
            if (isOverText) {
                setCursorOpacity(0.5);
                timeoutId = setTimeout(() => {
                    setCursorOpacity(0);
                    timeoutId = setTimeout(blink, 300);
                }, 700);
            } else {
                setCursorOpacity(0.5);
            }
        };

        blink();
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isOverText, isCursorVisible]);

    useEffect(() => {
        if (!isCursorVisible) return;
        let timeoutId: NodeJS.Timeout;

        const blink = () => {
            if (isSubcursorOverText) {
                setSubcursorOpacity(0.85);
                timeoutId = setTimeout(() => {
                    setSubcursorOpacity(0);
                    timeoutId = setTimeout(blink, 300);
                }, 700);
            } else {
                setSubcursorOpacity(0.85);
            }
        };

        blink();
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isSubcursorOverText, isCursorVisible]);

    const cursorVariants = useMemo(
        () => ({
            default: {
                width: 16,
                height: 16,
                borderRadius: 99,
                scale: 1,
                opacity: 0.5,
            },
            tooltipHovered: {
                width: textWidth + 20,
                height: 22,
                borderRadius: 99,
                scale: 1,
                opacity: 0.9,
            },
            text: {
                width: 4,
                height: textHeight,
                borderRadius: 99,
                scale: 1,
                opacity: cursorOpacity,
            },
            clickableText: {
                width: 4,
                height: textHeight,
                borderRadius: 99,
                scale: 1.2,
                opacity: 0.8,
            },
            clickable: {
                width: 16,
                height: 16,
                borderRadius: 4,
                scale: 1.2,
                opacity: 0.5,
            },
            headerLink: {
                width: headerLinkRect ? headerLinkRect.width + 12 : 16,
                height: headerLinkRect ? headerLinkRect.height + 10 : 16,
                borderRadius: 15,
                scale: 1,
                opacity: 0.5,
            },
            genericHover: {
                width: genericHoverRect ? genericHoverRect.width : 16,
                height: genericHoverRect ? genericHoverRect.height : 16,
                borderRadius: genericBorderRadius,
                scale: 1,
                opacity: 0.3,
            },
            subcursor: {
                width: 12,
                height: 12,
                borderRadius: 99,
                scale: 1,
                opacity: 0.85,
            },
            subcursorText: {
                width: 4,
                height: textHeight,
                borderRadius: 99,
                scale: 1,
                opacity: subcursorOpacity,
            },
            subcursorGeneric: {
                width: subcursorGenericRect ? subcursorGenericRect.width : 12,
                height: subcursorGenericRect ? subcursorGenericRect.height : 12,
                borderRadius: subcursorGenericBorderRadius,
                scale: 1,
                opacity: 0.3,
            },
        }),
        [
            textWidth,
            textHeight,
            headerLinkRect,
            genericHoverRect,
            genericBorderRadius,
            cursorOpacity,
            subcursorOpacity,
            subcursorGenericRect,
            subcursorGenericBorderRadius,
        ]
    );

    const textVariants = useMemo(
        () => ({
            hidden: {
                opacity: 0,
                scale: 0,
            },
            visible: {
                opacity: 1,
                scale: 1,
            },
        }),
        []
    );

    const getCursorVariant = useCallback(() => {
        if (headerLinkRect) return "headerLink";
        if (genericHoverRect) return "genericHover";
        if (hoveredTooltip?.hovered) return "tooltipHovered";
        if (isOverText && isClickable) return "clickableText";
        if (isOverText) return "text";
        if (isClickable) return "clickable";
        return "default";
    }, [
        headerLinkRect,
        genericHoverRect,
        hoveredTooltip?.hovered,
        isClickable,
        isOverText,
    ]);

    const getSubcursorVariant = useCallback(() => {
        if (subcursorGenericRect) return "subcursorGeneric";
        if (isSubcursorOverText) return "subcursorText";
        return "subcursor";
    }, [subcursorGenericRect, isSubcursorOverText]);

    useEffect(() => {
        if (typeof window === "undefined" || !isCursorVisible) return;

        const span = document.createElement("span");
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.style.whiteSpace = "nowrap";
        span.style.fontSize = "12px";
        tempSpanRef.current = span;

        return () => {
            if (tempSpanRef.current && document.body.contains(tempSpanRef.current)) {
                document.body.removeChild(tempSpanRef.current);
            }
        };
    }, [isCursorVisible]);

    const detectElements = useCallback(() => {
        if (typeof window === "undefined") return;

        const element = document.elementFromPoint(mousePosition.x, mousePosition.y);
        if (!element) {
            setIsOverText(false);
            setHeaderLinkRect(null);
            setGenericHoverRect(null);
            setGenericBorderRadius(15);
            setIsOverSubcursor(false);
            setIsSubcursorOverText(false);
            setSubcursorGenericRect(null);
            setSubcursorGenericBorderRadius(15);
            return;
        }

        const subcursorElement = element.closest("[data-cursor-subcursor]");
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isSafari) {
            if (subcursorElement instanceof HTMLElement) {
                const rect = subcursorElement.getBoundingClientRect();
                const isOver =
                    mousePosition.x >= rect.left &&
                    mousePosition.x <= rect.right &&
                    mousePosition.y >= rect.top &&
                    mousePosition.y <= rect.bottom;

                if (isOver !== isOverSubcursor) {
                    setIsOverSubcursor(isOver);
                }
            } else {
                setIsOverSubcursor(false);
            }
        } else {
            setIsOverSubcursor(!!subcursorElement);
        }

        const textElement = element.closest("[data-text-cursor]");
        setIsSubcursorOverText(!!textElement);

        const subcursorGenericElement = element.closest("[data-subcursor-generic]");
        if (subcursorGenericElement instanceof HTMLElement) {
            const rect = subcursorGenericElement.getBoundingClientRect();
            setSubcursorGenericRect(rect);

            const computedStyle = window.getComputedStyle(subcursorGenericElement);
            const borderRadius = computedStyle.borderRadius;
            const radiusValue = parseFloat(borderRadius.split(" ")[0]);
            setSubcursorGenericBorderRadius(radiusValue || 15);
        } else {
            setSubcursorGenericRect(null);
            setSubcursorGenericBorderRadius(15);
        }

        const shouldBeTextMode = !!textElement;
        setIsOverText(shouldBeTextMode);

        if (shouldBeTextMode && textElement instanceof HTMLElement) {
            const computedStyle = window.getComputedStyle(textElement);
            const lineHeight = computedStyle.lineHeight;

            const lineHeightValue =
                lineHeight === "normal"
                    ? parseFloat(computedStyle.fontSize) * 1
                    : parseFloat(lineHeight) * 1;
            setTextHeight((lineHeightValue || textElement.offsetHeight) + 3);
        } else {
            setTextHeight(0);
        }

        const headerLink = element.closest("[data-header-link]");
        if (headerLink instanceof HTMLElement) {
            setHeaderLinkRect(headerLink.getBoundingClientRect());
        } else {
            setHeaderLinkRect(null);
        }

        const genericElement = element.closest(
            "[data-cursor-generic], [data-cursor-generic-padded]"
        );
        if (genericElement instanceof HTMLElement) {
            const rect = genericElement.getBoundingClientRect();

            let padding = {top: 0, right: 0, bottom: 0, left: 0};
            if (genericElement.hasAttribute("data-cursor-generic-padded")) {
                const paddingConfig = genericElement.getAttribute(
                    "data-cursor-generic-padded"
                );

                if (!paddingConfig) {
                    padding = {top: 10, right: 10, bottom: 10, left: 10};
                } else {
                    try {
                        if (paddingConfig.startsWith("{")) {
                            const parsedPadding = JSON.parse(paddingConfig);
                            padding = {
                                top: parsedPadding.top ?? 0,
                                right: parsedPadding.right ?? 0,
                                bottom: parsedPadding.bottom ?? 0,
                                left: parsedPadding.left ?? 0,
                            };
                        } else {
                            const value = parseInt(paddingConfig, 10) || 10;
                            padding = {
                                top: value,
                                right: value,
                                bottom: value,
                                left: value,
                            };
                        }
                    } catch (e) {
                        console.error("Failed to parse padding configuration:", e);
                        padding = {top: 10, right: 10, bottom: 10, left: 10};
                    }
                }
            }

            padding = {
                top: Math.max(0, Number(padding.top) || 0),
                right: Math.max(0, Number(padding.right) || 0),
                bottom: Math.max(0, Number(padding.bottom) || 0),
                left: Math.max(0, Number(padding.left) || 0),
            };

            setGenericHoverRect({
                ...rect,
                width: rect.width + padding.left + padding.right,
                height: rect.height + padding.top + padding.bottom,
                left: rect.left - padding.left,
                top: rect.top - padding.top,
            });

            const computedStyle = window.getComputedStyle(genericElement);
            const borderRadius = computedStyle.borderRadius;
            const radiusValue = parseFloat(borderRadius.split(" ")[0]);
            setGenericBorderRadius(radiusValue || 15);
        } else {
            setGenericHoverRect(null);
            setGenericBorderRadius(15);
        }

        const socialLink = element.closest("[data-tooltip-hover]");
        if (socialLink) {
            const name = socialLink.getAttribute("data-tooltip-name");
            const hovered = socialLink.getAttribute("data-tooltip-hover") === "true";

            if (
                hoveredTooltip?.name !== name ||
                hoveredTooltip?.hovered !== hovered
            ) {
                setHoveredTooltip({name: name || "", hovered});

                if (tempSpanRef.current) {
                    tempSpanRef.current.textContent = name || "";
                    document.body.appendChild(tempSpanRef.current);
                    setTextWidth(tempSpanRef.current.offsetWidth);
                    document.body.removeChild(tempSpanRef.current);
                }
            }
        } else if (hoveredTooltip !== null) {
            setHoveredTooltip(null);
            setTextWidth(0);
        }
    }, [mousePosition.x, mousePosition.y, hoveredTooltip, isOverSubcursor]);

    const debouncedDetectElements = useDebounce(detectElements, 3);

    useEffect(() => {
        if (!isCursorVisible) return;
        debouncedDetectElements();
    }, [debouncedDetectElements, isCursorVisible]);

    useEffect(() => {
        if (!isCursorVisible) return;
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({x: e.clientX, y: e.clientY});
        };

        const handleHoverChange = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const clickable = target.closest(
                'a, button, [role="button"], [tabindex="0"]'
            );
            setIsClickable(!!clickable);
        };

        const handleMouseDown = () => {
            if (isOverSubcursor) {
                subcursorScale.set(0.8);
            } else {
                scale.set(0.8);
            }
        };

        const handleMouseUp = () => {
            if (isOverSubcursor) {
                subcursorScale.set(1);
            } else {
                scale.set(1);
            }
        };

        const handleScroll = () => {
            detectElements();
        };

        window.addEventListener("pointermove", handleMouseMove);
        window.addEventListener("pointerover", handleHoverChange);
        window.addEventListener("pointerout", handleHoverChange);
        window.addEventListener("pointerdown", handleMouseDown);
        window.addEventListener("pointerup", handleMouseUp);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseover", handleHoverChange);
        window.addEventListener("mouseout", handleHoverChange);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        window.addEventListener("scroll", handleScroll, {passive: true});
        document.addEventListener("scroll", handleScroll, {passive: true});

        return () => {
            window.removeEventListener("pointermove", handleMouseMove);
            window.removeEventListener("pointerover", handleHoverChange);
            window.removeEventListener("pointerout", handleHoverChange);
            window.removeEventListener("pointerdown", handleMouseDown);
            window.removeEventListener("pointerup", handleMouseUp);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseover", handleHoverChange);
            window.removeEventListener("mouseout", handleHoverChange);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("scroll", handleScroll);
        };
    }, [scale, subcursorScale, isOverSubcursor, detectElements, isCursorVisible]);

    if (!isCursorVisible) return null;

    return (
        <>
            <motion.div
                className="fixed pointer-events-none z-[999] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out bg-white ring-white"
                style={{
                    left: x,
                    top: y,
                    scale: isOverSubcursor ? 1 : scale,
                }}
                variants={cursorVariants}
                initial="default"
                animate={getCursorVariant()}
                transition={{
                    duration: 0.2,
                    ease: "easeOut",
                    borderRadius: {duration: 0.2, ease: "easeOut"},
                    ...((headerLinkRect || genericHoverRect) && {
                        type: "spring",
                        stiffness: 150,
                        damping: 15,
                        mass: 0.6,
                    }),
                }}
            >
                <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 scale-110"
                    initial={{opacity: 0}}
                    animate={{
                        opacity: isClickable ? 1 : 0,
                        width:
                            isClickable && !genericHoverRect && !hoveredTooltip?.hovered
                                ? cursorVariants[getCursorVariant()].width * 8
                                : cursorVariants[getCursorVariant()].width,
                        height:
                            isClickable && !genericHoverRect && !hoveredTooltip?.hovered
                                ? cursorVariants[getCursorVariant()].height * 1.5
                                : cursorVariants[getCursorVariant()].height,
                        borderRadius: cursorVariants[getCursorVariant()].borderRadius,
                        scale: 1,
                    }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                        borderRadius: {duration: 0.2, ease: "easeOut"},
                        ...((headerLinkRect || genericHoverRect) && {
                            type: "spring",
                            stiffness: 150,
                            damping: 15,
                            mass: 0.8,
                        }),
                    }}
                >
                    <GlowEffect
                        colors={[
                            "#fff085"
                        ]}
                        mode="colorShift"
                        blur="strongest"
                        duration={4}
                        scale={1}
                        className="h-full w-full"
                    />
                </motion.div>
                {hoveredTooltip?.hovered && (
                    <motion.div
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{duration: 0.2, ease: "easeOut"}}
                        className="absolute inset-0 flex items-center justify-center text-black text-xs whitespace-nowrap"
                    >
                        {hoveredTooltip.name}
                    </motion.div>
                )}
            </motion.div>
            {isOverSubcursor && (
                <motion.div
                    className="fixed pointer-events-none z-[999] transform -translate-x-1/2 -translate-y-1/2 bg-white"
                    style={{
                        left: subcursorX,
                        top: subcursorY,
                        scale: subcursorScale,
                    }}
                    variants={cursorVariants}
                    initial="subcursor"
                    animate={getSubcursorVariant()}
                    transition={{
                        duration: 0.2,
                        ease: "easeOut",
                        borderRadius: {duration: 0.2, ease: "easeOut"},
                        ...(subcursorGenericRect && {
                            type: "spring",
                            stiffness: 150,
                            damping: 15,
                            mass: 0.8,
                        }),
                    }}
                />
            )}
        </>
    );
};

export default CustomCursor;
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
    children: React.ReactNode[];
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showDots?: boolean;
    showArrows?: boolean;
    loop?: boolean;
    className?: string;
}

export default function Carousel({
    children,
    autoPlay = false,
    autoPlayInterval = 5000,
    showDots = true,
    showArrows = true,
    loop = true,
    className = "",
}: CarouselProps) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);
    const total = children.length;

    const goTo = useCallback(
        (index: number) => {
            setDirection(index > current ? 1 : -1);
            setCurrent(index);
        },
        [current]
    );

    const next = useCallback(() => {
        setDirection(1);
        setCurrent((prev) => (loop ? (prev + 1) % total : Math.min(prev + 1, total - 1)));
    }, [total, loop]);

    const prev = useCallback(() => {
        setDirection(-1);
        setCurrent((prev) => (loop ? (prev - 1 + total) % total : Math.max(prev - 1, 0)));
    }, [total, loop]);

    useEffect(() => {
        if (!autoPlay) return;
        const timer = setInterval(next, autoPlayInterval);
        return () => clearInterval(timer);
    }, [autoPlay, autoPlayInterval, next]);

    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
        }),
    };

    return (
        <div className={`relative w-full ${className}`}>
            {/* Arrows */}
            {showArrows && total > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 h-9 w-9 rounded-full bg-obsidian-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-gold-500 hover:border-gold-500/30 transition-all backdrop-blur-sm cursor-pointer"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 h-9 w-9 rounded-full bg-obsidian-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-gold-500 hover:border-gold-500/30 transition-all backdrop-blur-sm cursor-pointer"
                        aria-label="Próximo"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </>
            )}

            {/* Slide Container */}
            <div className="overflow-hidden w-full">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full"
                    >
                        {children[current]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots */}
            {showDots && total > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                    {Array.from({ length: total }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === current
                                ? "w-6 bg-gold-500"
                                : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
                                }`}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
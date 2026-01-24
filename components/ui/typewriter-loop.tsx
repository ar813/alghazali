"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface TypewriterLoopProps {
    texts: string[];
    className?: string;
    cursorClassName?: string;
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

export const TypewriterLoop = ({
    texts,
    className,
    cursorClassName,
    typingSpeed = 2, // Duration in seconds for reveal
    deletingSpeed = 1.5, // Duration in seconds for hide
    pauseDuration = 2000,
}: TypewriterLoopProps) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (phase === "typing") {
            timer = setTimeout(() => {
                setPhase("pausing");
            }, typingSpeed * 1000);
        } else if (phase === "pausing") {
            timer = setTimeout(() => {
                setPhase("deleting");
            }, pauseDuration);
        } else if (phase === "deleting") {
            timer = setTimeout(() => {
                setCurrentTextIndex((prev) => (prev + 1) % texts.length);
                setPhase("typing");
            }, deletingSpeed * 1000);
        }

        return () => clearTimeout(timer);
    }, [phase, typingSpeed, deletingSpeed, pauseDuration, texts.length]);

    return (
        <div className={cn("flex items-center justify-center space-x-1", className)}>
            <motion.div
                className="overflow-hidden whitespace-nowrap"
                initial={{ width: "0%" }}
                animate={{
                    width: phase === "typing" || phase === "pausing" ? "100%" : "0%"
                }}
                transition={{
                    duration: phase === "typing" ? typingSpeed : deletingSpeed,
                    ease: "easeInOut"
                }}
            >
                <div className="font-bold text-black dark:text-white whitespace-nowrap" style={{ width: "fit-content" }}>
                    {texts[currentTextIndex]}
                </div>
            </motion.div>

            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cn(
                    "inline-block w-[3px] h-6 sm:h-8 md:h-10 bg-blue-600 rounded-sm -ml-1", // Negative margin to sit tight
                    cursorClassName
                )}
            />
        </div>
    );
};

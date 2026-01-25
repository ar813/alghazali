"use client"

import { motion, useScroll, useSpring } from "framer-motion"
import { ReactNode } from "react"

/**
 * ScrollProgressBar component
 * Displays a thin progress bar at the top of the viewport
 */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll()
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] bg-primary origin-left z-[100]"
            style={{ scaleX }}
        />
    )
}

/**
 * SectionReveal component
 * Wraps content with a fade-up animation triggered on scroll
 */
export function SectionReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
                delay
            }}
        >
            {children}
        </motion.div>
    )
}

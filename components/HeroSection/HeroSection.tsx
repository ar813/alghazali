import { Megaphone } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { TypewriterLoop } from '@/components/ui/typewriter-loop'
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision'
import { Button } from "@chakra-ui/react"

const HeroSection = () => {
    const [mounted, setMounted] = useState(false)
    const [headlineTitle, setHeadlineTitle] = useState<string>('')
    const [headlineContent, setHeadlineContent] = useState<string>('')
    const [openHeadline, setOpenHeadline] = useState(false)

    const names = [
        "Al Ghazali High School",
        "Mahad Usman Bin Affan",
        "Al Razi Educational Society"
    ]

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // fetch most-recent headline notice (title + content)
        (async () => {
            try {
                const res = await fetch('/api/notices?headline=true&limit=1', { cache: 'no-store' })
                const json = await res.json()
                const item = json?.data?.[0]
                if (item) {
                    setHeadlineTitle(item.title || '')
                    setHeadlineContent(item.content || '')
                }
            } catch { }
        })()
    }, [])

    if (!mounted) return null;

    return (
        <>
            <section id="home" className="relative w-full overflow-hidden pt-16 sm:pt-20 pb-8">
                <BackgroundBeamsWithCollision className="h-[auto] min-h-[450px] flex flex-col justify-start items-center">
                    <div className="relative z-20 w-full max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center space-y-3 sm:space-y-4">

                        {/* Est. Badge - Compact */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.05)] backdrop-blur-md animate-fade-in-up">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600 dark:text-neutral-300">
                                Est. 1994
                            </span>
                        </div>

                        {/* Logo & Welcome Group - Tighter */}
                        <div className="flex flex-col items-center gap-2">
                            {/* Logo - Simple Round & Clean */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-sm border border-neutral-200 dark:border-neutral-800">
                                <img
                                    src="/logo.png"
                                    alt="Al Ghazali High School Logo"
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                />
                            </div>

                            <h2 className="text-lg sm:text-xl font-semibold text-neutral-500 dark:text-neutral-400 tracking-tight">
                                Welcome to
                            </h2>
                        </div>

                        {/* Typewriter with Backspace Animation */}
                        <div className="min-h-[50px] flex items-center justify-center w-full px-2 -mt-1">
                            <TypewriterLoop
                                texts={names}
                                className="text-xl sm:text-2xl md:text-4xl"
                                cursorClassName="h-5 sm:h-7 md:h-10"
                                typingSpeed={2}
                                deletingSpeed={1.5}
                                pauseDuration={2000}
                            />
                        </div>

                        {/* Description - Compact */}
                        <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed font-medium">
                            Nurturing young minds with <span className="text-blue-600 dark:text-blue-400 font-semibold">academic excellence</span>, Islamic values, and modern education.
                        </p>

                        {/* CTA Buttons - Compact Row */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center items-center pt-1">
                            <Button
                                asChild
                                size="lg"
                                rounded="full"
                                className="group relative px-8 bg-black dark:bg-white text-white dark:text-black font-bold text-sm sm:text-base shadow-lg shadow-blue-500/20 hover:bg-black/90 dark:hover:bg-white/90 transition-all hover:scale-100"
                            >
                                <a href="/student-portal" className="flex items-center gap-2">
                                    Student Portal
                                    <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 15 15"
                                        fill="none"
                                        className="transition-transform duration-300 group-hover:translate-x-1"
                                    >
                                        <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                </a>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                rounded="full"
                                className="px-6 font-bold text-sm sm:text-base border-neutral-200 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10"
                            >
                                <a href="/schedule">View Schedule</a>
                            </Button>
                        </div>

                        {/* Notice Pill - Glassmorphic & Clean */}
                        {(headlineTitle || headlineContent) && (
                            <div className="animate-fade-in w-full max-w-sm mx-auto pt-2 sm:pt-4">
                                <div
                                    onClick={() => setOpenHeadline(true)}
                                    className="cursor-pointer group relative overflow-hidden rounded-full border border-neutral-200/50 dark:border-white/10 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md p-1 pr-3 transition-all hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] active:scale-95"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <Megaphone size={12} className="animate-pulse" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="relative h-4 w-full">
                                                <div className="marquee-track absolute flex items-center whitespace-nowrap text-[10px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                                    <span className="font-bold text-neutral-900 dark:text-white mr-2">{headlineTitle}:</span>
                                                    <span className="mr-6">{headlineContent}</span>
                                                    <span className="font-bold text-neutral-900 dark:text-white mr-2">{headlineTitle}:</span>
                                                    <span className="mr-6">{headlineContent}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </BackgroundBeamsWithCollision>
            </section >

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0) translateZ(0); }
                    100% { transform: translateX(-50%) translateZ(0); }
                }
                .marquee-track {
                    animation: marquee 20s linear infinite;
                    will-change: transform;
                    backface-visibility: hidden;
                    perspective: 1000;
                }
                .group:hover .marquee-track {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Modal Overlay - Enterprise Smooth */}
            {openHeadline && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop with Fade */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setOpenHeadline(false)}
                    ></div>

                    {/* Modal Content - Responsive & Safe */}
                    <div className="relative w-full max-w-[95%] sm:max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 max-h-[85vh] flex flex-col">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

                        <button
                            onClick={() => setOpenHeadline(false)}
                            className="absolute top-3 right-3 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-20"
                            aria-label="Close Announcement"
                        >
                            <svg width="18" height="18" viewBox="0 0 15 15" fill="none" className="text-neutral-500"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.50005L3.21846 10.9685C2.99391 11.193 2.99391 11.5571 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31322L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.5571 12.0062 11.193 11.7816 10.9685L8.31322 7.50005L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </button>

                        <div className="p-6 sm:p-8 flex flex-col items-center text-center overflow-y-auto custom-scrollbar">
                            <div className="shrink-0 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 sm:mb-5 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-inner">
                                <Megaphone size={24} className="sm:w-8 sm:h-8" />
                            </div>

                            <h3 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight leading-snug">
                                {headlineTitle || 'Latest Announcement'}
                            </h3>

                            <div className="w-full prose prose-sm prose-blue dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300">
                                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                                    {headlineContent || 'No details available currently.'}
                                </p>
                            </div>

                            <div className="mt-6 sm:mt-8 w-full sm:w-auto">
                                <button
                                    onClick={() => setOpenHeadline(false)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-neutral-500/20"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default HeroSection
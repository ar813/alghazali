import { Megaphone } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const HeroSection = () => {
    const [mounted, setMounted] = useState(false)
    const [headlineTitle, setHeadlineTitle] = useState<string>('')
    const [headlineContent, setHeadlineContent] = useState<string>('')
    const [openHeadline, setOpenHeadline] = useState(false)

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
            } catch {}
        })()
    }, [])

    return (
        <>
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full opacity-20 blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full opacity-20 blur-3xl animate-pulse delay-2000 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Headline (static Title + animated Content) */}
            {(headlineTitle || headlineContent) && (
                <div className="absolute top-0 left-0 right-0 z-20">
                    <div className="mx-auto max-w-6xl px-3 sm:px-4 pt-4">
                        <div
                            className="relative rounded-2xl sm:rounded-full border border-rose-200/70 bg-rose-50/80 backdrop-blur shadow-md cursor-pointer"
                            onClick={() => setOpenHeadline(true)}
                            title="Open headline"
                            role="button"
                        >
                            <div className="grid grid-cols-[auto,1fr] items-center">
                                {/* Static Title badge */}
                                <div className="flex items-center gap-2 pl-3 pr-3 sm:pl-4 sm:pr-4 py-2 text-rose-800 whitespace-nowrap">
                                    <Megaphone className="shrink-0" size={16} />
                                    <span className="text-xs sm:text-sm md:text-base font-semibold truncate max-w-[45vw] sm:max-w-[30vw]">
                                        {headlineTitle || 'Headline'}
                                    </span>
                                </div>
                                {/* Animated Content ticker */}
                                <div className="relative overflow-hidden marquee-wrap">
                                    {/* edge fades to avoid sharp cut */}
                                    <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 bg-gradient-to-r from-rose-50/80 to-transparent" />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 bg-gradient-to-l from-rose-50/80 to-transparent" />
                                    <div className="marquee-track whitespace-nowrap text-rose-800/90 text-xs sm:text-sm md:text-base py-2 will-change-transform">
                                        <span className="mx-6 sm:mx-10 opacity-90">{headlineContent || '—'}</span>
                                        {/* duplicate for seamless loop */}
                                        <span className="mx-6 sm:mx-10 opacity-90">{headlineContent || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content (No Box) */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="Al Ghazali High School Logo" className="w-14 h-14 object-contain" />
                </div>

                <h1
                    className={`text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight ${mounted ? 'animate-[hero_headline_in_800ms_ease-out_forwards]' : ''}`}
                >
                    Welcome to Al Ghazali High School
                </h1>
                <style jsx>{`
                    @keyframes hero_headline_in {
                        0% { transform: translateX(120%); opacity: 0; }
                        100% { transform: translateX(0); opacity: 1; }
                    }
                    /* Seamless marquee: two copies inside .marquee-track */
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    :global(.marquee-track) {
                        display: inline-flex;
                        align-items: center;
                        animation: marquee 28s linear infinite;
                    }
                    @media (max-width: 640px) {
                        :global(.marquee-track) { animation-duration: 34s; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        :global(.marquee-track) { animation: none; padding-left: 0; }
                    }
                    /* Pause marquee when hovering over the container */
                    :global(.marquee-wrap:hover .marquee-track) {
                        animation-play-state: paused;
                    }
                `}</style>

                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto mb-4 sm:mb-6" />

                <p className="text-lg sm:text-xl text-gray-800 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-6">
                    Nurturing young minds with academic excellence, Islamic values, and modern education. Join our legacy of success spanning over 30 years.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                    <a 
                        href="/student-portal"
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-sm sm:text-base text-center"
                    >
                        Student Portal
                    </a>
                    <a 
                        href="/schedule"
                        className="w-full sm:w-auto bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors duration-300 text-sm sm:text-base text-center"
                    >
                        View Schedule
                    </a>
                </div>
            </div>
        </section>
        {openHeadline && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="relative w-full h-full p-6">
                    <button
                        onClick={() => setOpenHeadline(false)}
                        className="absolute top-4 right-4 text-white/90 text-3xl leading-none"
                        aria-label="Close"
                        title="Close"
                    >
                        ×
                    </button>
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="max-w-4xl mx-auto text-center px-6 space-y-4">
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow">{headlineTitle || 'Headline'}</h2>
                            {headlineContent ? (
                                <p className="text-white/95 text-lg sm:text-xl whitespace-pre-wrap">
                                    {headlineContent}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default HeroSection
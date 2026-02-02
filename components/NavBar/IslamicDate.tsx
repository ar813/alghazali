"use client";
import React, { useState, useEffect } from 'react';
import LordIcon from '@/components/ui/LordIcon';

interface HijriDate {
    day: string;
    month: {
        en: string;
        ar: string;
    };
    year: string;
}

interface IslamicDateProps {
    className?: string;
    variant?: 'nav' | 'sidebar';
}

export default function IslamicDate({ className = "", variant = 'nav' }: IslamicDateProps) {
    const [hijri, setHijri] = useState<HijriDate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDate = async () => {
            try {
                const cached = localStorage.getItem('hijri_date_cache');
                const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

                if (cached) {
                    const parsed = JSON.parse(cached);
                    const now = Date.now();
                    // Check if cache is valid (within 6 hours)
                    if (parsed.timestamp && (now - parsed.timestamp < CACHE_DURATION)) {
                        setHijri(parsed.data);
                        setLoading(false);
                        return;
                    }
                }

                const day = new Date().getDate();
                const month = new Date().getMonth() + 1;
                const year = new Date().getFullYear();

                const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`);
                const json = await res.json();

                if (json.status === "OK" && json.data.hijri) {
                    const data: HijriDate = {
                        day: json.data.hijri.day,
                        month: {
                            en: json.data.hijri.month.en,
                            ar: json.data.hijri.month.ar
                        },
                        year: json.data.hijri.year
                    };
                    setHijri(data);
                    setHijri(data);
                    localStorage.setItem('hijri_date_cache', JSON.stringify({
                        timestamp: Date.now(),
                        data: data
                    }));
                }
            } catch (error) {
                console.error('Islamic date error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDate();
    }, []);

    if (loading || !hijri) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1 ${className}`}>
                <div className="w-4 h-4 rounded-full bg-neutral-200/20 dark:bg-neutral-800/20 animate-pulse" />
                <div className="h-2 w-20 bg-neutral-200/20 dark:bg-neutral-800/20 rounded animate-pulse" />
            </div>
        );
    }

    if (variant === 'sidebar') {
        return (
            <div className={`flex flex-col gap-1 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 ${className}`}>
                <div className="flex items-center gap-2 mb-1">
                    <LordIcon
                        src="https://cdn.lordicon.com/shqbeite.json"
                        trigger="loop"
                        size={20}
                        colors="primary:#f59e0b,secondary:#f59e0b"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Islamic Calendar</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-500 font-serif">
                        {hijri.month.ar}
                    </span>
                    <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                        {hijri.day} {hijri.month.en} {hijri.year} AH
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`group flex items-center gap-3 px-4 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-all duration-300 ${className}`}>
            <LordIcon
                src="https://cdn.lordicon.com/shqbeite.json"
                trigger="hover"
                size={18}
                colors="primary:#f59e0b,secondary:#f59e0b"
            />
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-tight whitespace-nowrap">
                <span className="text-amber-600 dark:text-amber-500 font-bold font-serif text-[13px]">
                    {hijri.month.ar}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 font-bold">
                    {hijri.day} {hijri.month.en} {hijri.year} AH
                </span>
            </div>
        </div>
    );
}

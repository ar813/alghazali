import React, { memo } from 'react';

interface SchedulePeriodProps {
    index: number;
    subject: string;
    time: string;
}

const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    // Vercel-style: Subtle backgrounds with high contrast text for readability
    // Using Geist-inspired palette (zinc/slate/neutral) + semantic colors
    if (s.includes('math')) return 'bg-blue-100/50 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/30';
    if (s.includes('eng')) return 'bg-violet-100/50 text-violet-700 border-violet-200/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-900/30';
    if (s.includes('sci')) return 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30';
    if (s.includes('isl')) return 'bg-teal-100/50 text-teal-700 border-teal-200/50 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-900/30';
    if (s.includes('urd')) return 'bg-orange-100/50 text-orange-700 border-orange-200/50 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-900/30';
    if (s.includes('his') || s.includes('geo')) return 'bg-amber-100/50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/30';
    if (s.includes('phy') || s.includes('spo')) return 'bg-rose-100/50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/30';

    // Default for others
    return 'bg-zinc-100/80 text-zinc-600 border-zinc-200/50 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-800';
};

const SchedulePeriod = memo(({ index, subject, time }: SchedulePeriodProps) => {
    const colorClasses = getSubjectColor(subject);

    return (
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 group/period">
            <div className="flex items-center gap-3">
                {/* Index number with Geist mono style */}
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 w-4 select-none">
                    {(index + 1).toString().padStart(2, '0')}
                </span>

                {/* Subject Pill */}
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${colorClasses} transition-colors leading-tight`}>
                    {subject}
                </span>
            </div>

            {/* Time Slot */}
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-800">
                {time}
            </span>
        </div>
    );
});

SchedulePeriod.displayName = 'SchedulePeriod';

export default SchedulePeriod;

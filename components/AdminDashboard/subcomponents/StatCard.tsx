import React from 'react';

interface Stat {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
}

interface StatCardProps {
    stat: Stat;
}

const StatCard = ({ stat }: StatCardProps) => (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    {stat.value}
                </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-100 dark:group-hover:border-indigo-800">
                <stat.icon className="w-6 h-6 text-neutral-900 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
        </div>
        {/* Subtle progress bar placeholder for SaaS feel */}
        <div className="mt-4 h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500/20 w-[60%] rounded-full" />
        </div>
    </div>
);

export default StatCard;

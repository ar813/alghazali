import React from 'react';
import {
    Users,
    Trophy,
    Target,
    Search,
    RefreshCw,
    Download,
    Eye,
    EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Quiz {
    _id: string;
    title: string;
    subject: string;
    resultsAnnounced?: boolean;
}

interface ResultsHeaderProps {
    quizzes: Quiz[];
    selectedQuizId: string;
    onSelectQuiz: (id: string) => void;
    onRefresh: () => void;
    stats: {
        totalAttempts: number;
        passRate: number;
        avgScore: number;
        highestScore: number;
    };
    loading?: boolean;
    onToggleAnnounce?: () => void;
    isAnnouncing?: boolean;
    announced?: boolean;
    onExport?: () => void;
}

const ResultsHeader = ({
    quizzes,
    selectedQuizId,
    onSelectQuiz,
    onRefresh,
    stats,
    loading,
    onToggleAnnounce,
    isAnnouncing,
    announced,
    onExport
}: ResultsHeaderProps) => {
    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Controls Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">

                {/* Quiz Selector */}
                <div className="relative flex-1 group w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" size={16} />
                    <select
                        value={selectedQuizId}
                        onChange={(e) => onSelectQuiz(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Select an Assessment...</option>
                        {quizzes.map(q => (
                            <option key={q._id} value={q._id}>
                                {q.title} • {q.subject}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto">
                    {selectedQuizId && (
                        <>
                            <button
                                onClick={onToggleAnnounce}
                                disabled={isAnnouncing}
                                className={cn(
                                    "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap",
                                    announced
                                        ? "bg-amber-100/50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                        : "bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                )}
                            >
                                {isAnnouncing ? <Loader2 className="animate-spin" size={14} /> : (announced ? <EyeOff size={14} /> : <Eye size={14} />)}
                                {announced ? 'Hide' : 'Announce'}
                            </button>

                            <button
                                onClick={onExport}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 whitespace-nowrap shadow-sm"
                            >
                                <Download size={14} />
                                Export
                            </button>
                        </>
                    )}

                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block" />

                    <button
                        onClick={onRefresh}
                        className={cn(
                            "flex-none p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all ml-auto md:ml-0",
                            loading && "animate-pulse cursor-wait"
                        )}
                    >
                        <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            {selectedQuizId && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <StatCard
                        label="Attempts"
                        value={stats.totalAttempts.toString()}
                        icon={Users}
                        trend="Total Students"
                        color="blue"
                    />
                    <StatCard
                        label="Avg Score"
                        value={`${stats.avgScore}`}
                        icon={Trophy}
                        trend="Class Performance"
                        color="amber"
                    />
                    <StatCard
                        label="Pass Rate"
                        value={`${stats.passRate}%`}
                        icon={Target}
                        trend="Success Ratio"
                        color="emerald"
                    />
                    <StatCard
                        label="Top Score"
                        value={stats.highestScore.toString()}
                        icon={Trophy}
                        trend="Top Performer"
                        color="purple"
                    />
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, trend, color }: any) => {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
        <div className="bg-white dark:bg-zinc-950 p-3 sm:p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={cn("p-2 sm:p-2.5 rounded-xl border transition-colors", colors[color])}>
                    <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
            </div>
            <div>
                <h4 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-0.5 sm:mb-1 tracking-tight">{value}</h4>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-zinc-400 truncate">{label}</p>
            </div>
        </div>
    );
};

export default ResultsHeader;

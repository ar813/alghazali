import React from 'react';

interface DashboardInsightsProps {
    topClasses: [string, number][];
    totalStudents: number;
    totalNotices: number;
    onNoticeClick: () => void;
}

const DashboardInsights = ({ topClasses, totalStudents, totalNotices, onNoticeClick }: DashboardInsightsProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment by Class */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30">
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">Enrollment by Class</h3>
                </div>
                <div className="p-6">
                    {topClasses.length === 0 ? (
                        <div className="text-sm text-neutral-500 font-medium italic">No enrollment data available.</div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {topClasses.map(([cls, cnt]) => (
                                <div key={String(cls)} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Class {String(cls)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-1 mx-4">
                                        <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500/40 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (cnt / totalStudents) * 100 * 5)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{cnt}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notice Center */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30 flex items-center justify-between">
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">Notice Center</h3>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-tighter border border-indigo-500/20">Active: {totalNotices}</span>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed italic">
                        All campus-wide announcements and event notices are synchronized automatically. Real-time updates are pushed to student portals upon publication.
                    </p>
                    <button
                        onClick={onNoticeClick}
                        className="w-full py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all dark:text-neutral-400 dark:hover:text-indigo-400"
                    >
                        Open Publication Studio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardInsights;

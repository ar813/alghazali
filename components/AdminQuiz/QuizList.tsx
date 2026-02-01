"use client";

import React from 'react';
import { RefreshCw, Inbox, LayoutGrid, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuizCard from './QuizCard';

interface QuizListProps {
    items: any[];
    onEdit: (quiz: any) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
    loading: boolean;
    workingId: string | null;
}

const QuizList = ({ items, onEdit, onDelete, onRefresh, loading, workingId }: QuizListProps) => {
    return (
        <div className="w-full space-y-6">
            {/* List Control Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 rounded-3xl transition-all">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <LayoutGrid size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-zinc-900 dark:text-white tracking-tight leading-none uppercase">Quiz Dashboard</h3>
                        <p className="text-[10px] text-zinc-400 mt-1.5 font-bold uppercase tracking-widest italic">Inventory: {items.length} Modules</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                        <input
                            placeholder="Find assessment..."
                            className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-zinc-900 transition-all"
                        />
                    </div>
                    <button
                        onClick={onRefresh}
                        className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Loading / Empty States */}
            {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 px-4 bg-zinc-50/30 dark:bg-zinc-900/10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[40px] text-center">
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800 shadow-xl group hover:scale-110 transition-transform cursor-pointer">
                        <Inbox size={40} className="text-zinc-200 dark:text-zinc-700 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <h4 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Zero Assessments Found</h4>
                    <p className="text-sm text-zinc-500 max-w-[320px] font-medium leading-relaxed">
                        Start by creating your first quiz module or import a JSON database to populate the feed.
                    </p>
                    <button
                        onClick={onRefresh}
                        className="mt-8 px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 hover:opacity-90 transition-all"
                    >
                        Refresh Feed
                    </button>
                </div>
            )}

            {/* Skeleton Feed */}
            {loading && items.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 h-64 rounded-3xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Real Feed Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(quiz => (
                    <QuizCard
                        key={quiz._id}
                        quiz={quiz}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDeleting={workingId === quiz._id}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuizList;

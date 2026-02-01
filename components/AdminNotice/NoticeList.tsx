"use client";

import React from 'react';
import { RefreshCw, Trash2, Megaphone, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import NoticeItem from './NoticeItem';

interface NoticeListProps {
    items: any[];
    onEdit: (notice: any) => void;
    onDelete: (id: string) => void;
    onDeleteAll: () => void;
    onRefresh: () => void;
    loading: boolean;
    workingId: string | null;
}

const NoticeList = ({ items, onEdit, onDelete, onDeleteAll, onRefresh, loading, workingId }: NoticeListProps) => {
    return (
        <div className="w-full space-y-4">
            {/* List Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-100 dark:border-zinc-700 shadow-sm">
                        <Megaphone size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-none">History Feed</h3>
                        <p className="text-[11px] text-zinc-500 mt-1 font-medium italic">Showing latest {items.length} records</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={onRefresh}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={onDeleteAll}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                    >
                        <Trash2 size={14} />
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-center">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-700">
                        <Inbox size={32} className="text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Queue is Empty</h4>
                    <p className="text-sm text-zinc-500 max-w-[280px] leading-relaxed">
                        No announcements found in the database. Use the form above to post your first notice.
                    </p>
                    <button
                        onClick={onRefresh}
                        className="mt-6 flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all"
                    >
                        Check for Updates
                    </button>
                </div>
            )}

            {/* Skeleton Loading */}
            {loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full">
                    <div className="relative mb-4">
                        <div className="w-10 h-10 border-4 border-indigo-50 dark:border-indigo-900/30 rounded-full"></div>
                        <div className="absolute inset-0 w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider animate-pulse">Loading Feed...</span>
                </div>
            )}

            {/* List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map(notice => (
                    <NoticeItem
                        key={notice._id}
                        notice={notice}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDeleting={workingId === notice._id}
                    />
                ))}
            </div>
        </div>
    );
};

export default NoticeList;

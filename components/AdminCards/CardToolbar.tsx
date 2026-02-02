"use client";

import React from 'react';
import { Search, Filter, Calendar, Download, Save, X, CheckSquare, Square, RefreshCcw } from 'lucide-react';

interface CardToolbarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    filterClass: string;
    onFilterClassChange: (val: string) => void;
    classOptions: string[];
    side: 'front' | 'back' | 'both';
    onSideChange: (val: 'front' | 'back' | 'both') => void;
    issueDate: string;
    onIssueDateChange: (val: string) => void;
    expiryDate: string;
    onExpiryDateChange: (val: string) => void;
    selectedCount: number;
    totalVisible: number;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onDownloadZip: () => void;
    onSaveDates: () => void;
    onRefresh: () => void;
    savingDates: boolean;
    isDownloading: boolean;
}

const CardToolbar = ({
    searchTerm,
    onSearchChange,
    filterClass,
    onFilterClassChange,
    classOptions,
    side,
    onSideChange,
    issueDate,
    onIssueDateChange,
    expiryDate,
    onExpiryDateChange,
    selectedCount,
    totalVisible,
    onSelectAll,
    onClearSelection,
    onDownloadZip,
    onSaveDates,
    onRefresh,
    savingDates,
    isDownloading
}: CardToolbarProps) => {
    return (
        <div className="space-y-4">

            {/* Glassmorphic Main Bar */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-4 space-y-4">

                {/* Top Row: Search & Filters */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between">

                    <div className="flex-1 flex gap-3 min-w-0">
                        {/* Search Input */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" size={18} />
                            <input
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search students..."
                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all placeholder:text-zinc-400"
                            />
                            {searchTerm && (
                                <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Class Filter */}
                        <div className="relative min-w-[140px]">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                <Filter size={16} />
                            </div>
                            <select
                                value={filterClass}
                                onChange={(e) => onFilterClassChange(e.target.value)}
                                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all cursor-pointer font-medium"
                            >
                                {classOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-[10px]">▼</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={onRefresh} className="p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Reload Data">
                            <RefreshCcw size={18} />
                        </button>
                        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

                        {/* Side Toggle */}
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            {(['front', 'back', 'both'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onSideChange(s)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${side === s
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Dates & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Selection Stats */}
                        <div className="flex items-center gap-3 mr-2">
                            <button onClick={onSelectAll} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-all">
                                <CheckSquare size={14} /> All
                            </button>
                            <button onClick={onClearSelection} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-all">
                                <Square size={14} /> None
                            </button>
                            <span className="text-xs text-zinc-400 font-mono">
                                <span className="text-zinc-900 font-bold">{selectedCount}</span> / {totalVisible}
                            </span>
                        </div>

                        {/* Date Inputs */}
                        <div className="flex items-center gap-2">
                            <div className="relative max-w-[130px]">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <input type="date" value={issueDate} onChange={e => onIssueDateChange(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 focus:ring-1 focus:ring-zinc-900 transition-all font-mono" placeholder="Issue" />
                            </div>
                            <div className="relative max-w-[130px]">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <input type="date" value={expiryDate} onChange={e => onExpiryDateChange(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-xs border border-zinc-200 rounded-lg bg-zinc-50 focus:ring-1 focus:ring-zinc-900 transition-all font-mono" placeholder="Expiry" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={onSaveDates}
                            disabled={savingDates || (!issueDate && !expiryDate)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} /> Save Dates
                        </button>
                        <button
                            onClick={onDownloadZip}
                            disabled={isDownloading || selectedCount === 0}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-zinc-900 rounded-lg shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isDownloading ? <span className="animate-spin duration-1000">↻</span> : <Download size={16} />}
                            <span>Download ZIP</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardToolbar;

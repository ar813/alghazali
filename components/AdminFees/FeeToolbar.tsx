"use client";

import React from 'react';
import { Search, RotateCw, Upload, Trash2, Plus, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeeToolbarProps {
    filterClass: string;
    onFilterClassChange: (val: string) => void;
    filterMonth: string;
    onFilterMonthChange: (val: string) => void;
    filterYear: number | '';
    onFilterYearChange: (val: number | '') => void;
    filterStatus: string;
    onFilterStatusChange: (val: string) => void;
    search: string;
    onSearchChange: (val: string) => void;
    uniqueClasses: string[];
    months: readonly string[];
    onRefresh: () => void;
    onExport: () => void;
    onImportClick: () => void;
    onDeleteAll: () => void;
    onAddFee: () => void;
    loading: boolean;
    importLoading: boolean;
    hasFilters: boolean;
}

const FeeToolbar = ({
    filterClass,
    onFilterClassChange,
    filterMonth,
    onFilterMonthChange,
    filterYear,
    onFilterYearChange,
    filterStatus,
    onFilterStatusChange,
    search,
    onSearchChange,
    uniqueClasses,
    months,
    onRefresh,
    onExport,
    onImportClick,
    onDeleteAll,
    onAddFee,
    loading,
    importLoading,
    hasFilters
}: FeeToolbarProps) => {
    return (
        <div className="w-full space-y-3">
            {/* Main Container: Mobile First (Stack vertically) */}
            <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-3 sm:p-4">
                <div className="flex flex-col gap-3">

                    {/* Search: Full width always, adjusting padding for small screens */}
                    <div className="relative group w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-200 transition-colors" size={16} />
                        <input
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search Receipt, Roll, GR..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent outline-none transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Filters: Grid on Mobile (2 cols), Flex on Desktop */}
                    <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 w-full">
                        {/* Class Filter */}
                        <div className="relative w-full lg:w-40">
                            <select
                                value={filterClass}
                                onChange={(e) => onFilterClassChange(e.target.value)}
                                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm focus:bg-white outline-none transition-all cursor-pointer font-medium"
                            >
                                <option value="">All Classes</option>
                                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="relative w-full lg:w-36">
                            <select
                                value={filterStatus}
                                onChange={(e) => onFilterStatusChange(e.target.value)}
                                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm focus:bg-white outline-none transition-all cursor-pointer font-medium"
                            >
                                <option value="">Status: All</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                        </div>

                        {/* Month Filter */}
                        <div className="relative w-full lg:w-40">
                            <select
                                value={filterMonth}
                                onChange={(e) => onFilterMonthChange(e.target.value)}
                                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm focus:bg-white outline-none transition-all cursor-pointer font-medium"
                            >
                                <option value="">All Months</option>
                                {months.map(m => m !== 'Month' && <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Year Filter */}
                        <div className="relative w-full lg:w-28">
                            <input
                                type="number"
                                value={filterYear}
                                onChange={(e) => onFilterYearChange(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Year"
                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm focus:bg-white outline-none transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Actions: Align right on desktop, spread/stack on mobile */}
                    <div className="flex items-center gap-2 w-full justify-between sm:justify-end border-t border-zinc-100 dark:border-zinc-800 pt-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button onClick={onRefresh} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all" title="Reload Data">
                                <RotateCw size={18} className={cn(loading && "animate-spin")} />
                            </button>

                            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>

                            <button onClick={onExport} className="p-2 text-zinc-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Export Excel">
                                <FileSpreadsheet size={18} />
                            </button>

                            <button onClick={onImportClick} disabled={importLoading} className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50" title="Import Excel">
                                <Upload size={18} />
                            </button>

                            {hasFilters && (
                                <button onClick={onDeleteAll} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete All Filtered">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={onAddFee}
                            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 shrink-0"
                        >
                            <Plus size={16} />
                            <span>Add Fee</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeToolbar;

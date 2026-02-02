import React from 'react';
import { Calendar, Search, FileSpreadsheet } from 'lucide-react';

interface AttendanceFiltersProps {
    viewMode: 'daily' | 'monthly' | 'custom';
    setViewMode: (mode: 'daily' | 'monthly' | 'custom') => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    dateRange: { start: string; end: string };
    setDateRange: (range: { start: string; end: string }) => void;
    statusFilter: 'all' | 'present' | 'leave' | 'absent';
    setStatusFilter: (filter: 'all' | 'present' | 'leave' | 'absent') => void;
    search: string;
    setSearch: (search: string) => void;
    filterClass: string;
    setFilterClass: (cls: string) => void;
    classOptions: string[];
    handleExport: () => void;
    loading: boolean;
    presentCount: number;
    leaveCount: number;
    absentCount: number;
    filteredCount: number;
}

const AttendanceFilters = ({
    viewMode, setViewMode,
    selectedDate, setSelectedDate,
    selectedMonth, setSelectedMonth,
    dateRange, setDateRange,
    statusFilter, setStatusFilter,
    search, setSearch,
    filterClass, setFilterClass,
    classOptions,
    handleExport,
    loading,
    presentCount,
    leaveCount,
    absentCount,
    filteredCount
}: AttendanceFiltersProps) => {
    return (
        <div className="space-y-4">
            {/* Date/Month Selector - Ultra Compact on Mobile */}
            <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex bg-gray-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl flex-1 sm:flex-none">
                        {(['daily', 'monthly', 'custom'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg transition-all capitalize ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    {/* Live Status - Mobile Inline */}
                    <div className="px-2 py-1.5 text-[10px] font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50 rounded-lg border border-gray-100 whitespace-nowrap">
                        <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        {loading ? 'Sync' : 'Live'}
                    </div>
                </div>

                {/* Date Pickers */}
                <div className="flex items-center gap-2">
                    <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg text-gray-600 shrink-0">
                        <Calendar size={16} />
                    </div>
                    {viewMode === 'daily' ? (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                        />
                    ) : viewMode === 'monthly' ? (
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:border-blue-500 text-sm"
                            />
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:border-blue-500 text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
                {/* Status Filter Tabs - Compact */}
                <div className="flex overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 gap-1.5 sm:gap-2">
                    {[
                        { id: 'all', label: 'All', count: filteredCount },
                        { id: 'present', label: 'Present', count: presentCount },
                        { id: 'leave', label: 'Leave', count: leaveCount },
                        { id: 'absent', label: 'Absent', count: absentCount }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`whitespace-nowrap px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 border shrink-0 ${statusFilter === tab.id
                                ? `bg-gray-900 text-white border-gray-900 shadow-md`
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search, Class Filter, Export */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-700 text-sm cursor-pointer shadow-sm"
                        >
                            {classOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All' : c}</option>)}
                        </select>
                        <button
                            onClick={handleExport}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                        >
                            <FileSpreadsheet size={16} className="text-green-600" />
                            <span className="hidden sm:inline text-sm">Export</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceFilters;

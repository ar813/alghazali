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
        <div className="space-y-6">
            {/* Date/Month Selector */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['daily', 'monthly', 'custom'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                        <Calendar size={18} />
                    </div>
                    {viewMode === 'daily' ? (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer shadow-sm text-sm"
                        />
                    ) : viewMode === 'monthly' ? (
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer shadow-sm text-sm"
                        />
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:border-blue-500 text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:border-blue-500 text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
                {/* Status Filter Tabs */}
                <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 gap-2">
                    {[
                        { id: 'all', label: 'All Students', count: filteredCount },
                        { id: 'present', label: 'Present', count: presentCount },
                        { id: 'leave', label: 'On Leave', count: leaveCount },
                        { id: 'absent', label: 'Absent', count: absentCount }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${statusFilter === tab.id
                                ? `bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200`
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-md text-xs ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search and Class Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={17} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium shadow-sm"
                        />
                    </div>
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-gray-700 text-sm cursor-pointer shadow-sm min-w-[140px]"
                    >
                        {classOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
                    </select>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                        <FileSpreadsheet size={18} className="text-green-600" />
                        <span className="hidden sm:inline">Export Excel</span>
                    </button>

                    <div className="px-3 py-2.5 text-xs font-medium text-gray-500 flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-sm whitespace-nowrap">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        {loading ? 'Syncing...' : 'Live'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceFilters;

import React, { useState } from 'react';
import {
    Clock,
    Trash2,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Result {
    _id: string;
    studentName?: string;
    studentGrNumber?: string;
    studentRollNumber?: string;
    className?: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    grade: string;
    status: 'Pass' | 'Fail';
    submittedAt?: string;
    answers?: number[];
}

interface ResultsTableProps {
    results: Result[];
    loading: boolean;
    onViewDetail: (result: Result) => void;
    onDelete: (id: string) => void;
    deletingId: string | null;
}

const ResultsTable = ({ results, loading, onViewDetail, onDelete, deletingId }: ResultsTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = results.filter(r =>
        (r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (r.studentRollNumber?.includes(searchTerm)) ||
        (r.studentGrNumber?.includes(searchTerm))
    );

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                <Search className="text-zinc-300 dark:text-zinc-600" size={32} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No results found</h3>
                <p className="text-xs text-zinc-500 mt-1">Try adjusting your search terms</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {/* Table Header Filter */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search student..."
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-zinc-900 outline-none"
                    />
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:block">
                    {filtered.length} Records
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
                    <Loader2 className="animate-spin text-zinc-300" size={24} />
                    <p className="text-xs font-medium">Loading results...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="flex-1">
                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/30">Student Info</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/30">Meta</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/30">Performance</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/30">Result</th>
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50/30 dark:bg-zinc-900/30 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {filtered.map((row) => (
                                    <tr
                                        key={row._id}
                                        onClick={() => onViewDetail(row)}
                                        className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                    {row.studentName}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                                    Roll: {row.studentRollNumber || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit">
                                                    Class {row.className}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                                    <Clock size={10} />
                                                    {new Date(row.submittedAt || '').toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                                    <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{row.score}</span>
                                                    <span className="text-[8px] text-zinc-400 font-medium">/{row.totalQuestions}</span>
                                                </div>
                                                <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
                                                <div>
                                                    <div className="text-sm font-black text-zinc-800 dark:text-zinc-200">{row.percentage}%</div>
                                                    <div className="text-[10px] font-bold text-zinc-400">Score</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                                                row.status === 'Pass'
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
                                                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800"
                                            )}>
                                                {row.grade} • {row.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(row._id) }}
                                                    disabled={deletingId === row._id}
                                                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete Result"
                                                >
                                                    {deletingId === row._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                                <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filtered.map((row) => (
                            <div
                                key={row._id}
                                onClick={() => onViewDetail(row)}
                                className="p-4 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{row.studentName}</h4>
                                        <p className="text-xs text-zinc-500 font-medium">Roll: {row.studentRollNumber || 'N/A'}</p>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                                        row.status === 'Pass'
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            : "bg-rose-50 text-rose-600 border-rose-100"
                                    )}>
                                        {row.grade}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="flex items-center gap-1.5 text-zinc-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                            Class {row.className}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-zinc-500">
                                            <Clock size={12} />
                                            {new Date(row.submittedAt || '').toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="block text-sm font-black text-zinc-800 dark:text-zinc-200">{row.score}/{row.totalQuestions}</span>
                                            <span className="block text-[9px] font-bold text-zinc-400 uppercase">Score</span>
                                        </div>
                                        <ChevronRight size={16} className="text-zinc-300" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsTable;

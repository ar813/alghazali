"use client";

import React from 'react';
import { Edit2, Trash2, Check, X, Calendar, User, Hash, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeeTableProps {
    fees: any[];
    loading: boolean;
    onEdit: (fee: any) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: any) => void;
    onViewDetail: (fee: any) => void;
    deletingId?: string | null;
}

const FeeTable = ({
    fees,
    loading,
    onEdit,
    onDelete,
    onUpdateStatus,
    onViewDetail
}: FeeTableProps) => {

    // removed unused confirmDeleteId

    if (loading) {
        return (
            <div className="w-full space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 animate-pulse">
                        <div className="flex gap-3 mb-4">
                            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2"></div>
                                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"></div>
                            <div className="h-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (fees.length === 0) {
        return (
            <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                    <Banknote className="text-zinc-300 dark:text-zinc-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No Fees Found</h3>
                <p className="text-zinc-500 text-sm mt-1 max-w-xs">Adjust your search or filters to see results.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-xs uppercase font-medium text-zinc-500">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4">Month/Year</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {fees.map((fee) => (
                            <tr key={fee._id} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => onViewDetail(fee)}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                            {(fee.student?.fullName?.[0] || 'S').toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-white">{fee.student?.fullName || 'Unknown'}</div>
                                            <div className="text-[11px] text-zinc-500">Roll: {fee.student?.rollNumber || '-'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{fee.className || '-'}</td>
                                <td className="px-6 py-4">{fee.month} {fee.year}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium">{Number(fee.amountPaid).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border",
                                        fee.status === 'paid' ? "bg-green-50 text-green-700 border-green-200" :
                                            fee.status === 'partial' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                "bg-red-50 text-red-700 border-red-200"
                                    )}>
                                        {fee.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => onUpdateStatus(fee._id, fee.status === 'paid' ? 'unpaid' : 'paid')} className="p-1.5 text-zinc-400 hover:text-zinc-900">
                                            {fee.status === 'paid' ? <X size={16} /> : <Check size={16} />}
                                        </button>
                                        <button onClick={() => onEdit(fee)} className="p-1.5 text-zinc-400 hover:text-blue-600">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDelete(fee._id)} className="p-1.5 text-zinc-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile/Tablet Card Grid (Default view) */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {fees.map((fee) => (
                    <div
                        key={fee._id}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 active:bg-zinc-50 transition-colors shadow-sm"
                        onClick={() => onViewDetail(fee)}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                                    {(fee.student?.fullName?.[0] || 'S').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-zinc-900 dark:text-white truncate">{fee.student?.fullName || 'Unknown'}</div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                        <Hash size={12} /> {fee.student?.rollNumber || '-'}
                                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                        <User size={12} /> {fee.className || '-'}
                                    </div>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-bold uppercase shrink-0 border",
                                fee.status === 'paid' ? "bg-green-50 text-green-700 border-green-200" :
                                    fee.status === 'partial' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                        "bg-red-50 text-red-700 border-red-200"
                            )}>
                                {fee.status}
                            </span>
                        </div>

                        {/* Card Info Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-zinc-400 font-bold mb-0.5">Duration</span>
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    <Calendar size={12} className="text-zinc-400" />
                                    {fee.month} {fee.year}
                                </div>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] uppercase text-zinc-400 font-bold mb-0.5">Amount</span>
                                <div className="text-sm font-mono font-bold text-zinc-900 dark:text-white">
                                    PKR {Number(fee.amountPaid).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                            <div className="text-[10px] text-zinc-400 font-mono">
                                {fee.receiptNumber ? `#${fee.receiptNumber}` : 'No Receipt'}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onUpdateStatus(fee._id, fee.status === 'paid' ? 'unpaid' : 'paid')}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        fee.status === 'paid' ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                                    )}
                                >
                                    {fee.status === 'paid' ? <X size={18} /> : <Check size={18} />}
                                </button>
                                <button onClick={() => onEdit(fee)} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-all">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => onDelete(fee._id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeeTable;

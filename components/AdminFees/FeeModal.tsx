"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, DollarSign, Calendar, BookOpen, Hash } from 'lucide-react';
import type { Student } from '@/types/student';

interface FeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    students: Student[];
    MONTHS: readonly string[];
    submitting: boolean;
}

const FeeModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    students,
    MONTHS,
    submitting
}: FeeModalProps) => {
    const [form, setForm] = useState({
        studentId: '',
        className: '',
        month: MONTHS[new Date().getMonth() + 1],
        year: new Date().getFullYear(),
        amountPaid: 0 as number | '',
        paidDate: new Date().toISOString().slice(0, 10),
        receiptNumber: '',
        bookNumber: '',
        notes: '',
    });

    const [studentQuickFilter, setStudentQuickFilter] = useState('');

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({
                    studentId: initialData.student?._id || initialData.student?._ref || '',
                    className: initialData.className || '',
                    month: initialData.month,
                    year: initialData.year,
                    amountPaid: initialData.amountPaid ?? 0,
                    paidDate: initialData.paidDate || new Date().toISOString().slice(0, 10),
                    receiptNumber: initialData.receiptNumber || '',
                    bookNumber: initialData.bookNumber || '',
                    notes: initialData.notes || '',
                });
            } else {
                // Reset for create
                setForm({
                    studentId: '',
                    className: '',
                    month: MONTHS[new Date().getMonth() + 1],
                    year: new Date().getFullYear(),
                    amountPaid: 0,
                    paidDate: new Date().toISOString().slice(0, 10),
                    receiptNumber: '',
                    bookNumber: '',
                    notes: '',
                });
            }
            setStudentQuickFilter('');
        }
    }, [isOpen, initialData, MONTHS]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    const filteredStudents = students.filter(s => {
        const q = studentQuickFilter.trim().toLowerCase();
        if (!q) return true;
        return (s.rollNumber || '').toLowerCase().includes(q) ||
            (s.grNumber || '').toLowerCase().includes(q) ||
            (s.fullName || '').toLowerCase().includes(q);
    }).slice(0, 50); // Limit results for performance

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                            {initialData ? 'Edit Fee Record' : 'Add New Fee'}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            {initialData ? 'Update details for this transaction.' : 'Record a new fee payment from a student.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Student Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Student</label>
                            <input
                                value={studentQuickFilter}
                                onChange={e => setStudentQuickFilter(e.target.value)}
                                placeholder="Search by Name, Roll, or GR..."
                                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 mb-2 focus:ring-2 focus:ring-zinc-900 outline-none"
                            />
                            <select
                                value={form.studentId}
                                onChange={e => {
                                    const s = students.find(st => st._id === e.target.value);
                                    setForm(prev => ({
                                        ...prev,
                                        studentId: e.target.value,
                                        className: s?.admissionFor || prev.className
                                    }));
                                }}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none"
                                required
                            >
                                <option value="">Select Student</option>
                                {filteredStudents.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.fullName} (Roll: {s.rollNumber}, GR: {s.grNumber})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Class (Auto-filled usually) */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Class</label>
                            <input
                                value={form.className}
                                onChange={e => setForm({ ...form, className: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none font-medium"
                                required
                            />
                        </div>

                        {/* Month & Year */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Billing Period</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={form.month}
                                    onChange={e => setForm({ ...form, month: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none"
                                    required
                                >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <input
                                    type="number"
                                    value={form.year}
                                    onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                                    className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Amount Paid</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="number"
                                    value={form.amountPaid}
                                    onChange={e => setForm({ ...form, amountPaid: e.target.value === '' ? '' : Number(e.target.value) })}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none font-mono font-medium"
                                    required
                                />
                            </div>
                            {/* Quick Amount Chips */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {[800, 1000, 1200, 1500, 2000].map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, amountPaid: amt }))}
                                        className="px-2 py-1 text-xs border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-600"
                                    >
                                        {amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Payment Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="date"
                                    value={form.paidDate}
                                    onChange={e => setForm({ ...form, paidDate: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none font-mono"
                                    required
                                />
                            </div>
                        </div>

                        {/* Receipt & Book */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Receipt No.</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        value={form.receiptNumber}
                                        onChange={e => setForm({ ...form, receiptNumber: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none font-mono"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Book No.</label>
                                <div className="relative">
                                    <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        value={form.bookNumber}
                                        onChange={e => setForm({ ...form, bookNumber: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none font-mono"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notes (Optional)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none resize-none"
                            />
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span>Save Transaction</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default FeeModal;

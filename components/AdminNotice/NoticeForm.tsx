"use client";

import React, { useState } from 'react';
import { Megaphone, Save, Loader2, Calendar, Target, User, Layers, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student } from '@/types/student';

interface NoticeFormProps {
    students: Student[];
    classOptions: string[];
    onSubmit: (form: any) => Promise<void>;
    saving: boolean;
}

const NoticeForm = ({ students, classOptions, onSubmit, saving }: NoticeFormProps) => {
    const [form, setForm] = useState({
        title: '',
        content: '',
        targetType: 'all' as 'all' | 'class' | 'student',
        className: '',
        studentId: '',
        isEvent: false,
        eventDate: '',
        eventType: '',
        isHeadline: false,
    });
    const [studentQuickFilter, setStudentQuickFilter] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(form);
        if (!saving) {
            setForm({
                title: '', content: '', targetType: 'all', className: '',
                studentId: '', isEvent: false, eventDate: '', eventType: '', isHeadline: false
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all">
            <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Megaphone size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Create New Notice</h3>
                        <p className="text-xs text-zinc-500">Post announcements or events for students and staff.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                            <Type size={12} /> Title
                        </label>
                        <input
                            required
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400"
                            placeholder="e.g. Midterm Examination Schedule"
                        />
                    </div>

                    {/* Content */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                            <Layers size={12} /> Content
                        </label>
                        <textarea
                            required
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all min-h-[120px] resize-none placeholder:text-zinc-400"
                            placeholder="Provide detailed information here..."
                        />
                    </div>

                    {/* Target Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                            <Target size={12} /> Audience
                        </label>
                        <select
                            value={form.targetType}
                            onChange={e => setForm({ ...form, targetType: e.target.value as any })}
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none transition-all cursor-pointer font-medium"
                        >
                            <option value="all">Whole School</option>
                            <option value="class">Particular Class</option>
                            <option value="student">Individual Student</option>
                        </select>
                    </div>

                    {/* Conditional Targeting */}
                    {form.targetType === 'class' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                <User size={12} /> Target Class
                            </label>
                            <select
                                value={form.className}
                                required
                                onChange={e => setForm({ ...form, className: e.target.value })}
                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none transition-all cursor-pointer font-medium"
                            >
                                <option value="">Select Class</option>
                                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    {form.targetType === 'student' && (
                        <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Filter Student</label>
                                    <input
                                        value={studentQuickFilter}
                                        onChange={e => setStudentQuickFilter(e.target.value)}
                                        placeholder="Type Roll or GR..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs"
                                    />
                                </div>
                                <div className="flex-[2] space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Select Student</label>
                                    <select
                                        value={form.studentId}
                                        required
                                        onChange={e => setForm({ ...form, studentId: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-zinc-900 outline-none font-medium h-[41px]"
                                    >
                                        <option value="">Choose Student</option>
                                        {students
                                            .filter(s => {
                                                const q = studentQuickFilter.trim().toLowerCase();
                                                if (!q) return true;
                                                return String((s as any).rollNumber || '').toLowerCase().includes(q) ||
                                                    String(s.grNumber || '').toLowerCase().includes(q);
                                            })
                                            .slice(0, 100)
                                            .map(s => <option key={s._id} value={s._id}>{(s as any).rollNumber} - {s.fullName} (GR {s.grNumber})</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toggles and Event Info */}
                    <div className="md:col-span-2 flex flex-wrap gap-6 py-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.isEvent}
                                onChange={e => setForm({ ...form, isEvent: e.target.checked })}
                                className="w-4 h-4 rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Has Event Data</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.isHeadline}
                                onChange={e => setForm({ ...form, isHeadline: e.target.checked })}
                                className="w-4 h-4 rounded-md border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Important Headline</span>
                        </label>
                    </div>

                    {form.isEvent && (
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                    <Calendar size={12} /> Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.eventDate}
                                    onChange={e => setForm({ ...form, eventDate: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                                    <Megaphone size={12} /> Category
                                </label>
                                <input
                                    value={form.eventType}
                                    onChange={e => setForm({ ...form, eventType: e.target.value })}
                                    placeholder="e.g. Activity, Holiday"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Post Notice</span>
                </button>
            </div>
        </form>
    );
};

export default NoticeForm;

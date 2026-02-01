"use client";

import React, { useState } from 'react';
import { X, Save, Loader2, Calendar, Target, User, Type, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Student } from '@/types/student';

interface EditNoticeModalProps {
    notice: any;
    students: Student[];
    classOptions: string[];
    onClose: () => void;
    onSaved: (n: any) => void;
}

const EditNoticeModal = ({ notice, onClose, onSaved, students, classOptions }: EditNoticeModalProps) => {
    const [form, setForm] = useState({
        title: notice.title,
        content: notice.content,
        targetType: notice.targetType as 'all' | 'class' | 'student',
        className: notice.className || '',
        studentId: notice.student?._id || '',
        isEvent: !!notice.isEvent,
        isHeadline: !!notice.isHeadline,
        eventDate: notice.eventDate ? new Date(notice.eventDate).toISOString().slice(0, 16) : '',
        eventType: notice.eventType || '',
    });
    const [saving, setSaving] = useState(false);
    const [studentQuickFilter, setStudentQuickFilter] = useState('');

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/notices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: notice._id,
                    ...form,
                    eventDate: form.isEvent && form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
                    eventType: form.isEvent ? (form.eventType || 'General') : undefined,
                })
            });
            const json = await res.json();
            if (json?.ok) {
                onSaved({
                    ...notice,
                    ...form,
                    student: form.studentId ? students.find(s => s._id === form.studentId) : null,
                    _updatedAt: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error('Update failed', e);
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                            <Layers size={18} className="text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-none">Modify Announcement</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 font-medium italic">Updates will reflect immediately in student feeds</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Title</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none transition-all" />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Content</label>
                            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-zinc-900 outline-none transition-all resize-none" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Target Audience</label>
                            <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value as any })} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none font-medium">
                                <option value="all">Whole School</option>
                                <option value="class">Class</option>
                                <option value="student">Student</option>
                            </select>
                        </div>

                        {form.targetType === 'class' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Class</label>
                                <select value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none font-medium">
                                    <option value="">Select Class</option>
                                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}

                        {form.targetType === 'student' && (
                            <div className="md:col-span-2 space-y-3 animate-in slide-in-from-top-1 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-zinc-400">Search</label>
                                        <input value={studentQuickFilter} onChange={e => setStudentQuickFilter(e.target.value)} placeholder="Roll/GR..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-zinc-400">Selected</label>
                                        <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs outline-none font-semibold">
                                            <option value="">Choose...</option>
                                            {students.filter(s => {
                                                const q = studentQuickFilter.trim().toLowerCase();
                                                return !q || String((s as any).rollNumber || '').toLowerCase().includes(q) || String(s.grNumber || '').toLowerCase().includes(q);
                                            }).slice(0, 50).map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input type="checkbox" checked={form.isEvent} onChange={e => setForm({ ...form, isEvent: e.target.checked })} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 underline underline-offset-4 decoration-zinc-200">Post as Event</span>
                            </label>
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input type="checkbox" checked={form.isHeadline} onChange={e => setForm({ ...form, isHeadline: e.target.checked })} className="w-4 h-4 rounded border-zinc-300 text-red-500 focus:ring-red-500" />
                                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 underline underline-offset-4 decoration-zinc-200">Pin as Headline</span>
                            </label>
                        </div>

                        {form.isEvent && (
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-zinc-400">Event Timing</label>
                                    <input type="datetime-local" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-zinc-400">Event Category</label>
                                    <input value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none" placeholder="Activity/Meeting/Exam" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-white transition-all active:scale-95">
                        Discard
                    </button>
                    <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-7 py-2.5 rounded-xl text-sm font-bold shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditNoticeModal;

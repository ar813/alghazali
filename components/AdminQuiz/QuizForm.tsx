"use client";

import React, { useState } from 'react';
import { Plus, Save, Loader2, Target, Book, Key, Clock, ListChecks, Download, Upload } from 'lucide-react';
import QuestionItem from './QuestionItem';
import { toast } from 'sonner';

interface QuizFormProps {
    students: any[];
    classOptions: string[];
    onSubmit: (form: any) => Promise<void>;
    saving: boolean;
    genId: () => string;
}

const QuizForm = ({ students, classOptions, onSubmit, saving, genId }: QuizFormProps) => {
    const [form, setForm] = useState({
        title: '', subject: '', examKey: '', targetType: 'all' as 'all' | 'class' | 'student',
        className: '', studentId: '', durationMinutes: 30, questionLimit: 10,
        questions: [{ _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' }]
    });

    const addQuestion = () => setForm(f => ({
        ...f,
        questions: [...f.questions, { _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' }]
    }));

    const updateQuestion = (idx: number, patch: any) => {
        setForm(f => ({ ...f, questions: f.questions.map((q, i) => i === idx ? { ...q, ...patch } : q) }));
    };

    const removeQuestion = (idx: number) => setForm(f => ({
        ...f,
        questions: f.questions.length > 1 ? f.questions.filter((_, i) => i !== idx) : f.questions
    }));

    const handleExport = () => {
        try {
            const data = JSON.stringify(form.questions, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz_${form.title.replace(/\s+/g, '_') || 'draft'}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Questions exported successfully');
        } catch { toast.error('Export failed'); }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            if (Array.isArray(imported)) {
                setForm(f => ({
                    ...f,
                    questions: imported.map(q => ({ ...q, _key: genId() }))
                }));
                toast.success(`Imported ${imported.length} questions`);
            }
        } catch { toast.error('Check file format (JSON required)'); }
        finally { e.target.value = ''; }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(form);
        if (!saving) {
            setForm({
                title: '', subject: '', examKey: '', targetType: 'all',
                className: '', studentId: '', durationMinutes: 30, questionLimit: 10,
                questions: [{ _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' }]
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
                {/* Header Section */}
                <div className="p-5 sm:p-7 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/30 dark:bg-zinc-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-lg shadow-zinc-200 dark:shadow-none">
                            <Plus size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-none">New Assessment</h3>
                            <p className="text-xs text-zinc-500 mt-1 font-medium">Create interactive quizzes for your students.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95"
                        >
                            <Download size={14} /> Export
                        </button>
                        <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 cursor-pointer">
                            <Upload size={14} /> Import
                            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-5 sm:p-8 space-y-8">
                    {/* Basic Info */}
                    <section className="space-y-5">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                            <Book size={16} className="text-blue-500" />
                            <h4 className="text-sm font-bold uppercase tracking-wider">General Information</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Quiz Title</label>
                                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400" placeholder="e.g. Physics Midterm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject</label>
                                <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400" placeholder="e.g. Science" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-1.5">
                                    <Key size={10} /> Exam Key
                                </label>
                                <input required value={form.examKey} onChange={e => setForm({ ...form, examKey: e.target.value })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-400 font-mono" placeholder="ABC-123" />
                            </div>
                        </div>
                    </section>

                    {/* Settings */}
                    <section className="space-y-5">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                            <Clock size={16} className="text-amber-500" />
                            <h4 className="text-sm font-bold uppercase tracking-wider">Assessment Settings</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Duration (min)</label>
                                <input type="number" required value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Question Limit</label>
                                <input type="number" required value={form.questionLimit} onChange={e => setForm({ ...form, questionLimit: Number(e.target.value) })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 flex items-center gap-1.5">
                                    <Target size={10} /> Audience
                                </label>
                                <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value as any })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none font-bold cursor-pointer">
                                    <option value="all">Whole School</option>
                                    <option value="class">Particular Class</option>
                                    <option value="student">Individual</option>
                                </select>
                            </div>
                            {form.targetType !== 'all' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                                        {form.targetType === 'class' ? 'Select Class' : 'Select Student'}
                                    </label>
                                    {form.targetType === 'class' ? (
                                        <select required value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none font-bold cursor-pointer">
                                            <option value="">Select...</option>
                                            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <select required value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-zinc-900 outline-none font-bold cursor-pointer">
                                            <option value="">Choose Student...</option>
                                            {students.slice(0, 100).map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Questions Builder */}
                    <section className="space-y-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                                <ListChecks size={16} className="text-emerald-500" />
                                <h4 className="text-sm font-bold uppercase tracking-wider">Question Bank ({form.questions.length})</h4>
                            </div>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl shadow-lg active:scale-95 transition-all"
                            >
                                <Plus size={14} /> Add Question
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.questions.map((q, idx) => (
                                <QuestionItem
                                    key={q._key}
                                    index={idx}
                                    question={q}
                                    onUpdate={updateQuestion}
                                    onRemove={removeQuestion}
                                />
                            ))}
                        </div>

                        {form.questions.length > 3 && (
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Append New Question
                            </button>
                        )}
                    </section>
                </div>

                {/* Submit Footer */}
                <div className="p-5 sm:p-7 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-10 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-zinc-200 dark:shadow-none active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>Publish Quiz</span>
                    </button>
                </div>
            </div>
        </form>
    );
};

export default QuizForm;

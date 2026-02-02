"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, ListChecks, Plus, Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuestionItem from './QuestionItem';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface QuizEditDrawerProps {
    quiz: any;
    students: any[];
    classOptions: string[];
    onClose: () => void;
    onSaved: (n: any) => void;
    genId: () => string;
}

const QuizEditDrawer = ({ quiz, onClose, onSaved, students, genId }: QuizEditDrawerProps) => {
    const [form, setForm] = useState({
        ...quiz,
        studentId: quiz.student?._id || '',
        questions: quiz.questions?.map((q: any) => ({ ...q, _key: q._key || genId() })) || []
    });
    const [saving, setSaving] = useState(false);
    const [isVisible, setIsVisible] = useState(false);


    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Animation trigger with slight delay to ensure portal is ready
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const updateQuestion = (idx: number, patch: any) => {
        setForm((f: any) => ({ ...f, questions: f.questions.map((q: any, i: number) => i === idx ? { ...q, ...patch } : q) }));
    };

    const removeQuestion = (idx: number) => setForm((f: any) => ({
        ...f,
        questions: f.questions.length > 1 ? f.questions.filter((_: any, i: number) => i !== idx) : f.questions
    }));

    const addQuestion = () => setForm((f: any) => ({
        ...f,
        questions: [...f.questions, { _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' }]
    }));

    const save = async () => {
        if (!form.title.trim()) return toast.error('Title required');
        setSaving(true);
        try {

            const token = await user?.getIdToken();
            const res = await fetch('/api/quizzes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: quiz._id,
                    ...form,
                    studentId: form.targetType === 'student' ? form.studentId : undefined,
                    className: form.targetType === 'class' ? form.className : undefined
                })
            });
            const json = await res.json();
            if (json?.ok) {
                onSaved({
                    ...form,
                    student: form.studentId ? students.find(s => s._id === form.studentId) : null,
                    _updatedAt: new Date().toISOString()
                });
            }
        } catch {
            toast.error('Failed to update quiz');
        } finally { setSaving(false); }
    };

    if (!mounted) return null;

    // Portal to body to avoid parent stacking contexts (transforms/filters)
    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-hidden font-sans">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-zinc-950/20 backdrop-blur-[4px] transition-opacity duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                onClick={handleClose}
            />

            {/* Drawer Panel */}
            <div
                className={cn(
                    "absolute top-0 right-0 w-full max-w-2xl h-[100dvh] bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col border-l border-zinc-100 dark:border-zinc-800",
                    isVisible ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="shrink-0 p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg">
                            <Book size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-zinc-900 dark:text-white tracking-widest uppercase leading-none">Assessment Revision</h4>
                            <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-widest italic truncate max-w-[200px]">{quiz.title}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-white active:scale-95">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white dark:bg-zinc-950">
                    {/* Basic Info Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Title</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder:text-zinc-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Subject</label>
                            <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder:text-zinc-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Exam Key</label>
                            <input value={form.examKey} onChange={e => setForm({ ...form, examKey: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-300" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Duration (min)</label>
                            <input type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder:text-zinc-300" />
                        </div>
                    </div>

                    {/* Question Builder */}
                    <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white flex items-center gap-2">
                                <ListChecks size={12} className="text-emerald-500" />
                                Queston Feed <span className="opacity-40">[{form.questions.length}]</span>
                            </h5>
                            <button onClick={addQuestion} className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-900 hover:text-white transition-all active:scale-95">
                                <Plus size={10} /> New Entry
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.questions.map((q: any, idx: number) => (
                                <QuestionItem
                                    key={q._key}
                                    index={idx}
                                    question={q}
                                    onUpdate={updateQuestion}
                                    onRemove={removeQuestion}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-zinc-900 active:scale-95 transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    >
                        Discard
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all hover:translate-y-[-1px]"
                    >
                        {saving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default QuizEditDrawer;

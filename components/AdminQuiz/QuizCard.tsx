"use client";

import React from 'react';
import { Edit2, Trash2, Book, Clock, Target, Calendar, CheckCircle2, AlertCircle, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizCardProps {
    quiz: any;
    onEdit: (quiz: any) => void;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

const QuizCard = ({ quiz, onEdit, onDelete, isDeleting }: QuizCardProps) => {
    const formattedDate = new Date(quiz.createdAt || quiz._createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    return (
        <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all duration-300 flex flex-col justify-between overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-2 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform">
                <Book size={60} />
            </div>

            <div className="space-y-4">
                {/* Header Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border",
                        quiz.targetType === 'all' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            quiz.targetType === 'class' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                        {quiz.targetType}
                    </span>

                    {quiz.resultsAnnounced ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Live
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                            <AlertCircle size={10} /> Draft
                        </span>
                    )}
                </div>

                {/* Primary Content */}
                <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-tight flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        {quiz.title}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-zinc-400 shrink-0" />
                    </h4>
                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter mt-1">{quiz.subject}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <Layers size={14} className="text-zinc-400" />
                        <div className="min-w-0">
                            <div className="text-[9px] uppercase font-black text-zinc-400 leading-none">Questions</div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{quiz.questionLimit || quiz.questions?.length || 0}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <Clock size={14} className="text-zinc-400" />
                        <div className="min-w-0">
                            <div className="text-[9px] uppercase font-black text-zinc-400 leading-none">Duration</div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{quiz.durationMinutes || 0}m</div>
                        </div>
                    </div>
                </div>

                {/* Meta Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 italic">
                        <Calendar size={12} />
                        {formattedDate}
                    </div>

                    {quiz.targetType === 'student' && quiz.student?.fullName && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[9px] font-bold text-zinc-600 dark:text-zinc-400 max-w-[100px] truncate">
                            <Target size={10} /> {quiz.student.fullName}
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Actions Bar */}
            <div className="flex items-center gap-1.5 mt-4 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(quiz)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 transition-all active:scale-95"
                >
                    <Edit2 size={12} /> Edit
                </button>
                <button
                    onClick={() => onDelete(quiz._id)}
                    disabled={isDeleting}
                    className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all disabled:opacity-50"
                >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
            </div>
        </div>
    );
};

// Internal Loader to keep it self-contained
const Loader2 = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("animate-spin", className)}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default QuizCard;

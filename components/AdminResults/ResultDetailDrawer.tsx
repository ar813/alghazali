"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, X as XIcon, Hash, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultDetailDrawerProps {
    result: any;
    quizDetail: any;
    onClose: () => void;
}

const ResultDetailDrawer = ({ result, quizDetail, onClose, loading }: ResultDetailDrawerProps & { loading?: boolean }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (result) {
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [result]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    if (!mounted || !result) return null;

    const stats = [
        { label: 'Score', value: result.score, sub: `/${result.quiz?.totalQuestions || quizDetail?.totalQuestions}`, color: 'bg-zinc-900 text-white' },
        { label: 'Percentage', value: `${result.percentage}%`, sub: result.grade, color: result.percentage >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700' },
        { label: 'Rank', value: `#${result.rankInfo?.rank || '-'}`, sub: `of ${result.rankInfo?.total || '-'}`, color: 'bg-blue-100 text-blue-700' },
    ];

    const studentInfo = [
        { icon: User, label: 'Student', value: result.studentName || result.student?.fullName },
        { icon: Hash, label: 'Seat No', value: result.studentRollNumber || 'N/A' },
        { icon: GraduationCap, label: 'Class', value: result.className || result.student?.admissionFor },
    ];

    // ... renderAnswer definition ...

    const renderAnswer = (question: any, idx: number) => {
        const studentAnswerIdx = Number(result.answers?.[idx]);
        const correctIdx = Number(question.correctIndex);
        const isCorrect = studentAnswerIdx === correctIdx;
        // ... (rest of renderAnswer logic)

        // RE-INLINE IT HERE because replace_file_content needs the full function if we are replacing the block
        // Wait, I should probably use the original code for renderAnswer to avoid breaking it if I don't paste it all.
        // Actually, I can just keep the structure if I'm replacing the whole component logic.

        return (
            <div key={idx} className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all",
                isCorrect ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
            )}>
                <div className="flex gap-3 mb-3 sm:mb-4">
                    <span className={cn(
                        "shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black",
                        isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"
                    )}>
                        Q{idx + 1}
                    </span>
                    <p className="text-sm font-bold text-zinc-800 pt-0.5">{question.question}</p>
                </div>

                <div className="space-y-2 pl-0 sm:pl-9">
                    {question.options.map((opt: string, optIdx: number) => {
                        const isSelected = studentAnswerIdx === optIdx;
                        const isTheCorrectOne = correctIdx === optIdx;

                        let stateStyles = "border-zinc-100 bg-white text-zinc-500";
                        if (isTheCorrectOne) stateStyles = "border-emerald-200 bg-emerald-100 text-emerald-800 font-bold shadow-sm";
                        else if (isSelected && !isCorrect) stateStyles = "border-rose-200 bg-rose-100 text-rose-800 font-bold opacity-80";
                        else if (!isSelected) stateStyles = "opacity-60 grayscale";

                        return (
                            <div key={optIdx} className={cn(
                                "flex items-center justify-between p-3 rounded-xl border text-xs transition-all",
                                stateStyles
                            )}>
                                <span className="flex items-center gap-3">
                                    <span className="w-5 h-5 flex items-center justify-center rounded border bg-white/50 text-[10px] uppercase font-bold shrink-0">
                                        {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    {opt}
                                </span>
                                {isTheCorrectOne && <Check size={14} className="shrink-0" />}
                                {isSelected && !isCorrect && <XIcon size={14} className="shrink-0" />}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-hidden font-sans">
            <div
                className={cn(
                    "absolute inset-0 bg-zinc-950/20 backdrop-blur-[2px] transition-opacity duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                onClick={handleClose}
            />

            <div className={cn(
                "absolute top-0 right-0 w-full sm:max-w-lg h-[100dvh] bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col border-l border-zinc-100 dark:border-zinc-800",
                isVisible ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="shrink-0 p-4 sm:p-5 flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10 pt-safe-top">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {loading ? (
                                <div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                        result.percentage >= 40 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                    )}>
                                        {result.percentage >= 40 ? "Passed" : "Failed"}
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                        {new Date(result.submittedAt).toLocaleDateString()}
                                    </span>
                                </>
                            )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-tight">Result Analysis</h2>
                        <p className="text-xs text-zinc-500 font-medium truncate max-w-[200px] sm:max-w-[250px]">{result.quiz?.title}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500 shadow-sm active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-safe-bottom">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-zinc-400 animate-pulse">Loading Analysis...</p>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Student Card */}
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                <div className="grid grid-cols-1 gap-3">
                                    {studentInfo.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
                                                <item.icon size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.label}</p>
                                                <p className="font-bold text-zinc-800 dark:text-zinc-200">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {stats.map((stat, i) => (
                                    <div key={i} className={cn("p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm", stat.color.includes('bg-') ? stat.color.replace('bg-', 'bg-opacity-10 bg-') : "bg-zinc-100")}>
                                        <span className="text-xl font-black">{stat.value}</span>
                                        <span className="text-[9px] uppercase font-bold opacity-60">{stat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                            {/* Question Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">Answer Sheet</h4>
                                {quizDetail?.questions?.map((q: any, i: number) => renderAnswer(q, i))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ResultDetailDrawer;

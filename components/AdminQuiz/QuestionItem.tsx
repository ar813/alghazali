"use client";

import React from 'react';
import { Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionItemProps {
    index: number;
    question: any;
    onUpdate: (idx: number, patch: any) => void;
    onRemove: (idx: number) => void;
}

const QuestionItem = ({ index, question, onUpdate, onRemove }: QuestionItemProps) => {
    return (
        <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="hidden sm:flex mt-3 text-zinc-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} />
                </div>

                <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black">
                                {index + 1}
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Question</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={question.difficulty || 'easy'}
                                onChange={e => onUpdate(index, { difficulty: e.target.value })}
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border outline-none transition-all cursor-pointer",
                                    question.difficulty === 'hard' ? "bg-red-50 text-red-700 border-red-200" :
                                        question.difficulty === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            <button
                                onClick={() => onRemove(index)}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Question Input */}
                    <textarea
                        value={question.question}
                        onChange={e => onUpdate(index, { question: e.target.value })}
                        placeholder="Type your question here..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all resize-none min-h-[80px]"
                    />

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.options.map((option: string, oi: number) => (
                            <div
                                key={oi}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-xl border transition-all group/opt",
                                    question.correctIndex === oi
                                        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50"
                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                )}
                            >
                                <button
                                    onClick={() => onUpdate(index, { correctIndex: oi })}
                                    className={cn(
                                        "shrink-0 transition-colors",
                                        question.correctIndex === oi ? "text-emerald-600" : "text-zinc-300 dark:text-zinc-700 group-hover/opt:text-zinc-400"
                                    )}
                                >
                                    {question.correctIndex === oi ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </button>
                                <input
                                    value={option}
                                    onChange={e => {
                                        const newOpts = [...question.options];
                                        newOpts[oi] = e.target.value;
                                        onUpdate(index, { options: newOpts });
                                    }}
                                    placeholder={`Option ${oi + 1}`}
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 font-medium"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionItem;

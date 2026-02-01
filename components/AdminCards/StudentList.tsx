"use client";

import React from 'react';
import type { Student } from '@/types/student';

interface StudentListProps {
    students: Student[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    isLoading: boolean;
}

const StudentList = ({ students, selectedIds, onToggle, isLoading }: StudentListProps) => {
    if (isLoading) {
        return (
            <div className="space-y-2 p-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl animate-pulse">
                        <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <div className="w-2/3 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                            <div className="w-1/3 h-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <p className="text-sm font-medium">No students found.</p>
                <p className="text-xs opacity-60">Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-1 p-1">
            {students.map((s) => {
                const isSelected = selectedIds.has(s._id!);
                return (
                    <label
                        key={s._id}
                        className={`
              flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group
              ${isSelected
                                ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
                                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                            }
            `}
                    >
                        <div className="pt-0.5">
                            <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-all
                    ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-zinc-300 group-hover:border-zinc-400'}
                `}>
                                {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggle(s._id!)}
                                className="hidden"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-blue-900' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                {s.fullName}
                            </h4>
                            <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
                                {s.admissionFor ? `Class ${s.admissionFor}` : 'N/A'} • {s.rollNumber ? `Roll ${s.rollNumber}` : ''} {s.grNumber ? `• GR ${s.grNumber}` : ''}
                            </p>
                        </div>
                    </label>
                );
            })}
        </div>
    );
};

export default StudentList;

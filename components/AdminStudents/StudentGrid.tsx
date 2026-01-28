"use client";
import Image from 'next/image';
import { Phone } from 'lucide-react';
import { motion } from 'framer-motion';

import type { Student } from '@/types/student';

interface StudentGridProps {
    students: Student[];
    loading: boolean;
    onView: (student: Student) => void;
    onEdit: (student: Student) => void;
    onDelete: (id: string) => void;
    deleteLoadingId: string | null;
}

const StudentGrid: React.FC<StudentGridProps> = ({ students, loading, onView, onEdit, onDelete, deleteLoadingId }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm md:hidden">
                <div className="w-8 h-8 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 md:hidden">
                <p className="text-sm font-medium text-neutral-400 uppercase tracking-widest">No students found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
            {students.map((student, idx) => (
                <motion.div
                    key={student._id || student.grNumber}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => onView(student)}
                    className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-900 p-4 shadow-sm active:scale-[0.99] transition-all"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                            {student.photoUrl ? (
                                <Image src={student.photoUrl} alt={student.fullName} fill className="object-cover" unoptimized />
                            ) : (
                                <span className="text-base font-bold text-neutral-400">
                                    {student.fullName?.charAt(0) || '?'}
                                </span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-neutral-900 dark:text-white text-[15px] truncate">{student.fullName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Class {student.admissionFor}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">GR: {student.grNumber}</span>
                            </div>
                        </div>
                    </div>

                    <div className="py-3 border-y border-neutral-50 dark:border-neutral-900 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400 font-medium">Father:</span>
                            <span className="text-neutral-700 dark:text-neutral-300 font-bold">{student.fatherName}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-400 font-medium">Contact:</span>
                            <span className="text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1">
                                <Phone size={10} /> {student.phoneNumber || '—'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                            className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 transition-all"
                        >
                            Edit
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (student._id) onDelete(student._id); }}
                            className="px-4 py-2 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl hover:bg-rose-100 transition-all"
                        >
                            {deleteLoadingId === student._id ? '...' : 'Delete'}
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default StudentGrid;

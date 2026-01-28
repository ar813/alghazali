"use client";
import React from 'react';
import Image from 'next/image';
import { Edit, Trash2, Phone } from 'lucide-react';

import type { Student } from '@/types/student';

interface StudentTableProps {
    students: Student[];
    loading: boolean;
    onView: (student: Student) => void;
    onEdit: (student: Student) => void;
    onDelete: (id: string) => void;
    deleteLoadingId: string | null;
}

const StudentTable: React.FC<StudentTableProps> = ({ students, loading, onView, onEdit, onDelete, deleteLoadingId }) => {

    const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : '?';

    if (loading) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm">
                <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
                <p className="mt-4 text-sm font-medium text-neutral-500">Loading directory...</p>
            </div>
        )
    }

    if (students.length === 0) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm text-center">
                <p className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No Students Found</p>
                <p className="text-sm text-neutral-500">Try adjusting your filters or search query.</p>
            </div>
        )
    }

    return (
        <div className="hidden md:block bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                            <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Roll No</th>
                            <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">GR No</th>
                            <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Father Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-900">
                        {students.map((student) => (
                            <tr
                                key={student._id || student.grNumber}
                                onClick={() => onView(student)}
                                className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl flex-shrink-0 overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 relative">
                                            {student.photoUrl ? (
                                                <Image src={student.photoUrl} alt="" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-neutral-400 font-bold text-sm">
                                                    {getInitial(student.fullName)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">{student.fullName}</div>
                                            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{student.gender}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold uppercase border border-neutral-200 dark:border-neutral-700">
                                        Class {student.admissionFor}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400 font-medium">{student.rollNumber || '—'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400 font-medium">{student.grNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">{student.fatherName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 text-sm">
                                        <Phone size={14} className="text-neutral-400" />
                                        <span>{student.phoneNumber || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                                            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (student._id) onDelete(student._id); }}
                                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            {deleteLoadingId === student._id ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentTable;

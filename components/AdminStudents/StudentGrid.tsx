import React from 'react';
import Image from 'next/image';
import { User, ClipboardList, BookOpen } from 'lucide-react';

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
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Loading directory...</p>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-400">No students found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 md:hidden">
            {students.map((student) => (
                <div
                    key={student._id || student.grNumber}
                    onClick={() => onView(student)}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
                >
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {student.photoUrl ? (
                                <Image src={student.photoUrl} alt={student.fullName} width={56} height={56} className="rounded-xl object-cover border border-gray-100 bg-gray-50" unoptimized />
                            ) : (

                                <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-xl">
                                    {student.fullName?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate leading-tight mb-1">{student.fullName}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                                <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                    <BookOpen size={10} /> Class {student.admissionFor}
                                </span>
                                <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                    <ClipboardList size={10} /> GR: {student.grNumber}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                <User size={10} /> Father: {student.fatherName}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                            className="text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200"
                        >
                            Edit
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (student._id) onDelete(student._id); }}
                            className="text-xs font-semibold text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-100"
                        >

                            {deleteLoadingId === student._id ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StudentGrid;

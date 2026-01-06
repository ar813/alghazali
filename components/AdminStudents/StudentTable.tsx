import React from 'react';
import Image from 'next/image';
import { Edit, Trash2 } from 'lucide-react';

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

    // Fallback avatar helper
    const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : '?';

    if (loading) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading students directory...</p>
            </div>
        )
    }

    if (students.length === 0) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
                <p className="text-xl font-semibold text-gray-700 mb-1">No Students Found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
            </div>
        )
    }

    return (
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/80 border-b border-gray-100 backdrop-blur">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">GR No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Father Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map((student) => (
                            <tr
                                key={student._id || student.grNumber}
                                onClick={() => onView(student)}
                                className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200 relative">
                                            {student.photoUrl ? (
                                                <Image src={student.photoUrl} alt="" fill className="object-cover" unoptimized />
                                            ) : (

                                                <div className="h-full w-full flex items-center justify-center text-gray-700 font-bold text-sm bg-gray-100">
                                                    {getInitial(student.fullName)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">{student.fullName}</div>
                                            <div className="text-[11px] text-gray-500">{student.gender}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs border border-gray-200">
                                        {student.admissionFor}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.rollNumber || '—'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.grNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.fatherName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {student.phoneNumber || student.whatsappNumber || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit Student"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (student._id) onDelete(student._id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Student"
                                        >

                                            {deleteLoadingId === student._id ? <div className="w-4 h-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Pagination or summary could go here */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {students.length} students</span>
                {/* Pagination if needed later */}
            </div>
        </div>
    );
};

export default StudentTable;

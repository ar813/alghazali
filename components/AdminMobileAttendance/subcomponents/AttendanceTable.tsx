import React from 'react';
import Image from 'next/image';

interface AttendanceRecord {
    id: string;
    date: string;
    studentName: string;
    class: string;
    rollNumber: string;
    grNumber: string;
    photoUrl: string | null;
    timestamp: number;
    status: 'present' | 'leave';
    reason?: string;
}

interface AttendanceTableProps {
    records: AttendanceRecord[];
    formatTime: (epoch: number) => string;
}

const AttendanceTable = ({ records, formatTime }: AttendanceTableProps) => {
    return (
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-medium">
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4 text-center">Class</th>
                            <th className="px-6 py-4">Roll / GR</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            {record.photoUrl ? (
                                                <Image
                                                    src={record.photoUrl}
                                                    alt={record.studentName}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="flex w-10 h-10 bg-gray-100 text-gray-500 rounded-full items-center justify-center font-medium text-sm border border-gray-200">
                                                    {record.studentName?.charAt(0).toUpperCase() || 'S'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm tracking-tight">{record.studentName}</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">ID: {record.id.slice(0, 6)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5 text-center">
                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                        {record.class}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <span className="text-gray-400">R:</span>
                                            <span className="font-mono font-medium">{record.rollNumber || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <span className="text-gray-400">GR:</span>
                                            <span className="font-mono">{record.grNumber || '-'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5">
                                    <div className="text-sm text-gray-600 font-medium">
                                        {formatTime(record.timestamp)}
                                    </div>
                                </td>
                                <td className="px-6 py-3.5 text-center">
                                    {(record as any).isAbsent ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                            Absent
                                        </span>
                                    ) : record.status === 'present' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Present
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            On Leave
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTable;

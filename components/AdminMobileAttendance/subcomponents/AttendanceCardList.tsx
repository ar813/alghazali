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

interface AttendanceCardListProps {
    records: AttendanceRecord[];
    formatTime: (epoch: number) => string;
}

const AttendanceCardList = ({ records, formatTime }: AttendanceCardListProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {records.map((record) => (
                <div key={record.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 active:scale-[0.99] transition-transform">
                    <div className="relative shrink-0">
                        {record.photoUrl ? (
                            <Image
                                src={record.photoUrl}
                                alt={record.studentName}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="flex w-12 h-12 bg-gray-100 text-gray-500 rounded-full items-center justify-center font-bold text-base border border-gray-200">
                                {record.studentName?.charAt(0).toUpperCase() || 'S'}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100">
                            {(record as any).isAbsent ? (
                                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                            ) : record.status === 'present' ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                            ) : (
                                <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm tracking-tight truncate">{record.studentName}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Class {record.class} • Roll {record.rollNumber}</p>
                            </div>
                            <span className="text-xs font-mono text-gray-400">{formatTime(record.timestamp)}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(record as any).isAbsent ? (
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Absent</span>
                                ) : record.status === 'present' ? (
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Present</span>
                                ) : (
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">On Leave</span>
                                )}
                                {record.reason && (
                                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 max-w-[100px] truncate">
                                        {record.reason}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AttendanceCardList;

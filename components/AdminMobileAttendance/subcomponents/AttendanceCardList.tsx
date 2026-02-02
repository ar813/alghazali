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
        <div className="grid grid-cols-1 gap-2 md:hidden">
            {records.map((record) => (
                <div key={record.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 active:scale-[0.99] transition-transform">
                    {/* Avatar */}
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
                            <div className="flex w-10 h-10 bg-gray-100 text-gray-500 rounded-full items-center justify-center font-bold text-sm border border-gray-200">
                                {record.studentName?.charAt(0).toUpperCase() || 'S'}
                            </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 border border-gray-100">
                            {(record as any).isAbsent ? (
                                <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                            ) : record.status === 'present' ? (
                                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></div>
                            ) : (
                                <div className="w-3 h-3 rounded-full bg-amber-500 border border-white"></div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm tracking-tight truncate">{record.studentName}</h4>
                                <p className="text-[11px] text-gray-500 truncate">
                                    {record.class} • R:{record.rollNumber}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-[10px] font-mono text-gray-400 block">{formatTime(record.timestamp)}</span>
                                {(record as any).isAbsent ? (
                                    <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded inline-block mt-0.5">Absent</span>
                                ) : record.status === 'present' ? (
                                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">Present</span>
                                ) : (
                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">Leave</span>
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

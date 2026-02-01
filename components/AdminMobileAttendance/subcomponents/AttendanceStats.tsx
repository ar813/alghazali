import React from 'react';
import { Smartphone, UserCheck, UserMinus, UserX } from 'lucide-react';
import type { Student } from '@/types/student';

interface AttendanceStatsProps {
    allStudentsCount: number;
    presentCount: number;
    leaveCount: number;
    absentCount: number;
}

const AttendanceStats = ({ allStudentsCount, presentCount, leaveCount, absentCount }: AttendanceStatsProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Smartphone size={20} />
                    </div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Students</p>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{allStudentsCount}</h3>
                    <p className="text-gray-400 text-xs mt-1">Registered in system</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <UserCheck size={20} />
                    </div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Present</p>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{presentCount}</h3>
                    <p className="text-green-600 text-xs mt-1 font-medium bg-green-50 inline-block px-1.5 py-0.5 rounded">
                        {allStudentsCount > 0 ? Math.round((presentCount / allStudentsCount) * 100) : 0}% Attendance
                    </p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <UserMinus size={20} />
                    </div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">On Leave</p>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{leaveCount}</h3>
                    <p className="text-gray-400 text-xs mt-1">Authorized leaves</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-50 rounded-lg text-red-600">
                        <UserX size={20} />
                    </div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Absent</p>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{absentCount}</h3>
                    <p className="text-red-600 text-xs mt-1 font-medium bg-red-50 inline-block px-1.5 py-0.5 rounded">
                        Unexcused absence
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceStats;

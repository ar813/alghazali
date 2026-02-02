import React from 'react';
import { Smartphone, UserCheck, UserMinus, UserX } from 'lucide-react';

interface AttendanceStatsProps {
    allStudentsCount: number;
    presentCount: number;
    leaveCount: number;
    absentCount: number;
}

const AttendanceStats = ({ allStudentsCount, presentCount, leaveCount, absentCount }: AttendanceStatsProps) => {
    const attendancePercent = allStudentsCount > 0 ? Math.round((presentCount / allStudentsCount) * 100) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {/* Total Students */}
            <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Smartphone size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Students</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{allStudentsCount}</h3>
            </div>

            {/* Present */}
            <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg text-green-600">
                        <UserCheck size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Present</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{presentCount}</h3>
                <p className="text-green-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium bg-green-50 inline-block px-1 sm:px-1.5 py-0.5 rounded">
                    {attendancePercent}%
                </p>
            </div>

            {/* On Leave */}
            <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg text-amber-600">
                        <UserMinus size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Leave</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{leaveCount}</h3>
            </div>

            {/* Absent */}
            <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg text-red-600">
                        <UserX size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Absent</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">{absentCount}</h3>
            </div>
        </div>
    );
};

export default AttendanceStats;

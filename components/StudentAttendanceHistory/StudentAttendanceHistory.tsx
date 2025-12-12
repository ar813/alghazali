"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Calendar, Clock, TrendingUp, UserCheck, UserX, UserMinus, X } from 'lucide-react';

interface HistoryRecord {
    date: string; // YYYY-MM-DD (document ID)
    status: 'present' | 'leave';
    timestamp: number;
}

interface StudentAttendanceHistoryProps {
    grNumber: string;
    studentName: string;
    onClose: () => void;
}

const StudentAttendanceHistory = ({ grNumber, studentName, onClose }: StudentAttendanceHistoryProps) => {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Initialize date range (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const formatDate = (date: Date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        setStartDate(formatDate(thirtyDaysAgo));
        setEndDate(formatDate(today));
    }, []);

    // Fetch history from Firestore
    useEffect(() => {
        if (!grNumber || !startDate || !endDate) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const historyRef = collection(db, `attendance/${grNumber}/history`);
                const q = query(historyRef, orderBy('date', 'desc'));
                const snapshot = await getDocs(q);

                const data: HistoryRecord[] = [];
                snapshot.forEach((doc) => {
                    const record = { date: doc.id, ...doc.data() } as HistoryRecord;
                    // Filter by date range
                    if (record.date >= startDate && record.date <= endDate) {
                        data.push(record);
                    }
                });

                setHistory(data);
            } catch (error) {
                console.error("Error fetching attendance history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [grNumber, startDate, endDate]);

    // Calculate statistics
    const presentCount = history.filter(r => r.status === 'present').length;
    const leaveCount = history.filter(r => r.status === 'leave').length;
    const totalDays = history.length;
    const presentPercentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : '0';

    const formatTime = (epoch: number) => {
        if (!epoch) return '-';
        return new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{studentName}</h2>
                            <p className="text-blue-100 text-sm mt-1">GR Number: {grNumber}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Date Range Selector */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            <span className="text-sm font-semibold text-gray-600">Date Range:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={18} className="text-blue-600" />
                            <span className="text-xs font-semibold text-blue-600 uppercase">Total Days</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{totalDays}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <UserCheck size={18} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-600 uppercase">Present</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{presentCount}</p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                        <div className="flex items-center gap-2 mb-2">
                            <UserMinus size={18} className="text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-600 uppercase">Leave</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">{leaveCount}</p>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={18} className="text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-600 uppercase">Attendance %</span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-900">{presentPercentage}%</p>
                    </div>
                </div>

                {/* History Table */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <UserX size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No History Found</h3>
                            <p className="text-gray-500">No attendance records found for the selected date range.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((record) => (
                                <div
                                    key={record.date}
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-gray-600 min-w-[140px]">
                                            <Calendar size={16} className="text-blue-500" />
                                            <span className="font-semibold">{formatDateDisplay(record.date)}</span>
                                        </div>
                                        {record.timestamp > 0 && (
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <Clock size={14} />
                                                <span>{formatTime(record.timestamp)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {record.status === 'present' ? (
                                            <span className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Present
                                            </span>
                                        ) : (
                                            <span className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                                On Leave
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendanceHistory;

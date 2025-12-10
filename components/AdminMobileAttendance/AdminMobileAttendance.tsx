"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Calendar, Search, Smartphone, Clock, User, Hash, AlertCircle } from 'lucide-react';

// Define the exact structure as provided
interface AttendanceRecord {
    id: string; // Document ID
    date: string; // YYYY-MM-DD
    studentName: string;
    class: string;
    rollNumber: string;
    grNumber: string;
    photoUrl: string | null;
    timestamp: number; // Epoch time
}

const AdminMobileAttendance = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('All');
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Dummy classes for filter - can be dynamic if needed
    const classOptions = ['All', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'SSCI', 'SSCII'];

    useEffect(() => {
        // Set default date to today in YYYY-MM-DD format
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }, []);

    useEffect(() => {
        if (!selectedDate) return;

        if (onLoadingChange) onLoadingChange(true);
        setLoading(true);

        const q = query(
            collection(db, 'daily_attendance'),
            where("date", "==", selectedDate)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: AttendanceRecord[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
            });

            // Client-side sort by timestamp desc (latest first)
            data.sort((a, b) => b.timestamp - a.timestamp);

            setRecords(data);
            setLoading(false);
            if (onLoadingChange) onLoadingChange(false);
        }, (error) => {
            console.error("Error fetching attendance:", error);
            setLoading(false);
            if (onLoadingChange) onLoadingChange(false);
        });

        // Cleanup listener on unmount or date change
        return () => unsubscribe();
    }, [selectedDate, onLoadingChange]);

    const formatTime = (epoch: number) => {
        if (!epoch) return '-';
        return new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredRecords = records.filter(r => {
        const term = search.toLowerCase();
        const matchesSearch =
            (r.studentName?.toLowerCase().includes(term) || '') ||
            (r.rollNumber?.toLowerCase().includes(term) || '') ||
            (r.grNumber?.toLowerCase().includes(term) || '');

        const matchesClass = filterClass === 'All' || r.class === filterClass || r.class === `Class ${filterClass}`;
        return matchesSearch && matchesClass;
    });

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <Smartphone size={28} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold tracking-tight">{records.length}</h3>
                            <p className="text-blue-100 text-sm font-medium tracking-wide">Synced Reocrds</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">View Date</p>
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                        <Calendar size={18} className="text-blue-600" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent font-semibold text-gray-700 focus:outline-none w-full cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-20 backdrop-blur-xl bg-white/80">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1 p-2">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Name, Roll No..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="px-4 py-3 bg-gray-50/50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 text-sm cursor-pointer"
                    >
                        {classOptions.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : `${c}`}</option>)}
                    </select>
                </div>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 flex items-center gap-2 bg-gray-50 rounded-lg mx-2 border border-gray-100">
                    <div className={`w-2 h-2 rounded-full shadow-sm ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                    {loading ? 'Syncing...' : 'Real-time'}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {filteredRecords.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            No attendance data available for <span className="font-semibold text-gray-700">{selectedDate}</span>.
                            Ensure the mobile app has synced data for this date.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4 text-center">Class</th>
                                    <th className="px-6 py-4">Identifiers</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    {record.photoUrl ? (
                                                        <img
                                                            src={record.photoUrl}
                                                            alt={record.studentName}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                                        />
                                                    ) : null}
                                                    {/* Fallback avatar */}
                                                    <div className={`${record.photoUrl ? 'hidden' : 'flex'} w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full items-center justify-center font-bold text-lg border-2 border-white shadow-md group-hover:scale-105 transition-transform`}>
                                                        {record.studentName?.charAt(0).toUpperCase() || 'S'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-base">{record.studentName}</div>
                                                    <div className="text-xs text-gray-500 font-medium mt-0.5">ID: {record.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                {record.class}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Hash size={14} className="text-gray-400" />
                                                    <span className="font-mono">{record.rollNumber || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <User size={13} className="text-gray-400" />
                                                    <span className="font-mono">GR: {record.grNumber || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-lg w-fit border border-gray-100">
                                                <Clock size={16} className="text-blue-500" />
                                                <span>{formatTime(record.timestamp)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Present
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMobileAttendance;

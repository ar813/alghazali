"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Calendar, Search, Smartphone, Clock, User, Hash, AlertCircle, UserCheck, UserX, UserMinus } from 'lucide-react';
import { client } from '@/sanity/lib/client';
import { getAllStudentsQuery } from '@/sanity/lib/queries';
import type { Student } from '@/types/student';

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
    status: 'present' | 'leave'; // Status from mobile app
    reason?: string; // Optional leave reason (only for status: 'leave')
}

const AdminMobileAttendance = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('All');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'leave' | 'absent'>('all');

    // Dummy classes for filter - can be dynamic if needed
    const classOptions = ['All', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'SSCI', 'SSCII'];

    // Fetch all students from Sanity for absent calculation
    useEffect(() => {
        const fetchAllStudents = async () => {
            try {
                console.log("🔄 Fetching all students from Sanity...");
                const students = await client.fetch<Student[]>(getAllStudentsQuery);
                console.log("✅ Sanity students fetched:", students.length);
                console.log("📋 Sample student:", students[0]);
                setAllStudents(students);
            } catch (error) {
                console.error("❌ Error fetching all students from Sanity:", error);
            }
        };
        fetchAllStudents();
    }, []);

    useEffect(() => {
        // Set default date to today in YYYY-MM-DD format (local Pakistan time)
        const today = new Date();

        // Get local date components (this already accounts for timezone)
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        console.log("📅 Today's date (formatted):", formattedDate);
        console.log("🕐 Full date object:", today.toString());
        console.log("🌍 Timezone offset:", today.getTimezoneOffset());

        setSelectedDate(formattedDate);
    }, []);

    useEffect(() => {
        if (!selectedDate) {
            console.log("⚠️ No date selected");
            return;
        }

        console.log("📅 Selected Date:", selectedDate);
        if (onLoadingChange) onLoadingChange(true);
        setLoading(true);

        // ========== TEST QUERY: Fetch ALL documents (no filter) ==========
        console.log("🧪 TEST: Fetching ALL documents from daily_attendance...");
        const testQuery = query(collection(db, 'daily_attendance'));

        onSnapshot(testQuery, (testSnapshot: any) => {
            console.log("🧪 TEST: Total documents in collection:", testSnapshot.size);
            testSnapshot.forEach((doc: any) => {
                const data = doc.data();
                console.log("🧪 TEST Doc:", {
                    id: doc.id,
                    date: data.date,
                    status: data.status,
                    grNumber: data.grNumber,
                    studentName: data.studentName
                });
            });
        }, { onlyOnce: true } as any);
        // ================================================================

        // ========== TEMPORARY: Fetch ALL (no date filter) ==========
        console.log("🔍 TEMP: Fetching ALL documents (no date filter for testing)");
        // const q = query(collection(db, 'daily_attendance'));
        // Original query with date filter:
        const q = query(
            collection(db, 'daily_attendance'),
            where("date", "==", selectedDate)
        );
        // ============================================================

        console.log("🔍 Querying Firestore with date:", selectedDate);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("📦 Firestore snapshot received. Total docs:", snapshot.size);

            const data: AttendanceRecord[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                // FIX: If status is undefined, default to 'present'
                // FIX: Ensure all fields are strings to prevent UI errors
                const status = docData.status || 'present';

                console.log(`📄 Doc ${doc.id}: Status=${status} (Raw=${docData.status})`);

                data.push({
                    id: doc.id,
                    ...docData,
                    status: status,
                    // Ensure robust fallbacks
                    studentName: docData.studentName || 'Unknown Student',
                    class: docData.class || '-',
                    rollNumber: docData.rollNumber || '-',
                    grNumber: docData.grNumber || '-',
                    timestamp: docData.timestamp || 0
                } as AttendanceRecord);
            });

            console.log("✅ Total records fetched:", data.length);
            console.log("Present:", data.filter(r => r.status === 'present').length);
            console.log("Leave:", data.filter(r => r.status === 'leave').length);

            // Client-side sort by timestamp desc (latest first)
            data.sort((a, b) => b.timestamp - a.timestamp);

            setRecords(data);
            setLoading(false);
            if (onLoadingChange) onLoadingChange(false);
        }, (error) => {
            console.error("❌ Error fetching attendance:", error);
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

    // Calculate absent students and apply filters
    const getFilteredData = () => {
        // Get present and leave students (from Firestore)
        const presentRecords = records.filter(r => r.status === 'present');
        const leaveRecords = records.filter(r => r.status === 'leave');

        // Get GR numbers of present and leave students
        const attendedGrNumbers = new Set(records.map(r => r.grNumber));

        console.log("🔢 Attended GR Numbers:", Array.from(attendedGrNumbers));
        console.log("👥 Total students in Sanity:", allStudents.length);
        console.log("📊 Present records:", presentRecords.length);
        console.log("📊 Leave records:", leaveRecords.length);

        // Calculate absent students (in Sanity but not in Firestore)
        const absentStudents = allStudents.filter(s => !attendedGrNumbers.has(s.grNumber));

        console.log("❌ Absent students count:", absentStudents.length);
        if (absentStudents.length > 0) {
            console.log("📋 First absent student:", absentStudents[0]);
        }

        // Create absent "records" for display
        interface DisplayRecord extends AttendanceRecord {
            isAbsent?: boolean;
        }

        const absentRecords: DisplayRecord[] = absentStudents.map(s => ({
            // FIX: Use _id as fallback if grNumber is missing to prevent duplicate keys
            id: `absent-${s.grNumber || s._id}`,
            date: selectedDate,
            studentName: s.fullName,
            class: s.admissionFor,
            rollNumber: s.rollNumber,
            grNumber: s.grNumber || 'N/A',
            photoUrl: s.photoUrl || null,
            timestamp: 0,
            status: 'leave' as const, // Placeholder type, but treated as absent in UI
            isAbsent: true
        }));

        // Combine all records based on status filter
        let allRecords: DisplayRecord[] = [];
        if (statusFilter === 'all') {
            allRecords = [...presentRecords, ...leaveRecords, ...absentRecords];
        } else if (statusFilter === 'present') {
            allRecords = presentRecords;
        } else if (statusFilter === 'leave') {
            allRecords = leaveRecords;
        } else if (statusFilter === 'absent') {
            allRecords = absentRecords;
        }

        // Apply search and class filters
        return allRecords.filter(r => {
            const term = search.toLowerCase();
            const matchesSearch =
                (r.studentName?.toLowerCase().includes(term) || '') ||
                (r.rollNumber?.toLowerCase().includes(term) || '') ||
                (r.grNumber?.toLowerCase().includes(term) || '');

            const matchesClass = filterClass === 'All' || r.class === filterClass || r.class === `Class ${filterClass}`;
            return matchesSearch && matchesClass;
        });
    };

    const filteredRecords = getFilteredData();

    // Calculate stats
    const presentCount = records.filter(r => r.status === 'present').length;
    const leaveCount = records.filter(r => r.status === 'leave').length;
    const absentCount = allStudents.length - records.length;

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                            <Smartphone size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold tracking-tight">{allStudents.length}</h3>
                            <p className="text-blue-100 text-xs font-medium tracking-wide">Total Students</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-2xl text-white shadow-lg shadow-green-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                            <UserCheck size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold tracking-tight">{presentCount}</h3>
                            <p className="text-green-100 text-xs font-medium tracking-wide">Present</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-6 rounded-2xl text-white shadow-lg shadow-yellow-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                            <UserMinus size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold tracking-tight">{leaveCount}</h3>
                            <p className="text-yellow-100 text-xs font-medium tracking-wide">On Leave</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-gray-500 to-slate-500 p-6 rounded-2xl text-white shadow-lg shadow-gray-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                            <UserX size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold tracking-tight">{absentCount}</h3>
                            <p className="text-gray-100 text-xs font-medium tracking-wide">Absent</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Selector */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-600" />
                    <span className="text-sm font-semibold text-gray-600">Viewing Date:</span>
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                />
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${statusFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All ({filteredRecords.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('present')}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${statusFilter === 'present'
                            ? 'bg-green-600 text-white shadow-md shadow-green-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Present ({presentCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('leave')}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${statusFilter === 'leave'
                            ? 'bg-yellow-600 text-white shadow-md shadow-yellow-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        On Leave ({leaveCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('absent')}
                        className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${statusFilter === 'absent'
                            ? 'bg-gray-600 text-white shadow-md shadow-gray-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Absent ({absentCount})
                    </button>
                </div>

                {/* Search and Class Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
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
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                        {loading ? 'Syncing...' : 'Real-time'}
                    </div>
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
                                                        <Image
                                                            src={record.photoUrl}
                                                            alt={record.studentName}
                                                            width={48}
                                                            height={48}
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
                                            {(record as any).isAbsent ? (
                                                <span className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200 shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                    Absent
                                                </span>
                                            ) : record.status === 'present' ? (
                                                <span className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Present
                                                </span>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="inline-flex gap-1.5 items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                                        On Leave
                                                    </span>
                                                    {record.reason && (
                                                        <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200 max-w-[200px] truncate" title={record.reason}>
                                                            {record.reason}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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

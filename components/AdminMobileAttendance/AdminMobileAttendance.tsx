"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { toast } from "sonner";
import { client } from '@/sanity/lib/client';
import { getAllStudentsQuery } from '@/sanity/lib/queries';
import type { Student } from '@/types/student';
import AttendanceStats from './subcomponents/AttendanceStats';
import AttendanceFilters from './subcomponents/AttendanceFilters';
import AttendanceTable from './subcomponents/AttendanceTable';
import AttendanceCardList from './subcomponents/AttendanceCardList';

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
                const students = await client.fetch<Student[]>(getAllStudentsQuery);
                setAllStudents(students);
            } catch (error) {
                console.error("❌ Error fetching all students from Sanity:", error);
            }
        };
        fetchAllStudents();
    }, []);

    const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'custom'>('daily');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        setSelectedDate(`${yyyy}-${mm}-${dd}`);
        setSelectedMonth(`${yyyy}-${mm}`);
        setDateRange({
            start: `${yyyy}-${mm}-01`,
            end: `${yyyy}-${mm}-${dd}`
        });
    }, []);

    useEffect(() => {
        if ((viewMode === 'daily' && !selectedDate) ||
            (viewMode === 'monthly' && !selectedMonth) ||
            (viewMode === 'custom' && (!dateRange.start || !dateRange.end))) {
            return;
        }

        if (onLoadingChange) onLoadingChange(true);
        setLoading(true);

        let q;
        if (viewMode === 'daily') {
            q = query(collection(db, 'daily_attendance'), where("date", "==", selectedDate));
        } else if (viewMode === 'monthly') {
            const startStr = `${selectedMonth}-01`;
            const endStr = `${selectedMonth}-31`;
            q = query(collection(db, 'daily_attendance'), where("date", ">=", startStr), where("date", "<=", endStr));
        } else {
            q = query(collection(db, 'daily_attendance'), where("date", ">=", dateRange.start), where("date", "<=", dateRange.end));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: AttendanceRecord[] = [];
            const attendedDates = new Set<string>();

            snapshot.forEach((doc) => {
                const docData = doc.data();
                const status = docData.status || 'present';
                if (docData.date) attendedDates.add(docData.date);
                data.push({
                    id: doc.id,
                    ...docData,
                    status: status,
                    studentName: docData.studentName || 'Unknown Student',
                    class: docData.class || '-',
                    rollNumber: docData.rollNumber || '-',
                    grNumber: docData.grNumber || '-',
                    timestamp: docData.timestamp || 0
                } as AttendanceRecord);
            });

            // Calculate 'Absent' records for every student on every active day in the range
            const activeDays = Array.from(attendedDates);
            const attendanceMap = new Set(data.map(r => `${r.grNumber}-${r.date}`));
            const generatedAbsents: AttendanceRecord[] = [];

            if (activeDays.length > 0 && allStudents.length > 0) {
                activeDays.forEach(day => {
                    allStudents.forEach(student => {
                        const key = `${student.grNumber || 'none'}-${day}`;
                        if (!attendanceMap.has(key)) {
                            generatedAbsents.push({
                                id: `absent-${student.grNumber || student._id}-${day}`,
                                date: day,
                                studentName: student.fullName,
                                class: student.admissionFor,
                                rollNumber: student.rollNumber,
                                grNumber: student.grNumber || 'N/A',
                                photoUrl: student.photoUrl || null,
                                timestamp: 0,
                                status: 'leave', // Dummy
                                reason: 'Absent',
                                // @ts-ignore
                                isAbsent: true
                            } as any);
                        }
                    });
                });
            }

            const combinedData = [...data, ...generatedAbsents];
            combinedData.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return a.studentName.localeCompare(b.studentName);
            });

            setRecords(combinedData);
            setLoading(false);
            if (onLoadingChange) onLoadingChange(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
            if (onLoadingChange) onLoadingChange(false);
        });

        return () => unsubscribe();
    }, [selectedDate, selectedMonth, dateRange, viewMode, onLoadingChange, allStudents]);

    const formatTime = (epoch: number) => {
        if (!epoch) return '-';
        return new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate absent students and apply filters
    const filteredRecords = records.filter(r => {
        const term = search.toLowerCase();
        const matchesSearch =
            (r.studentName?.toLowerCase().includes(term) || '') ||
            (r.rollNumber?.toLowerCase().includes(term) || '') ||
            (r.grNumber?.toLowerCase().includes(term) || '');

        const matchesClass = filterClass === 'All' || r.class === filterClass || r.class === `Class ${filterClass}`;

        let matchesStatus = true;
        if (statusFilter === 'present') matchesStatus = r.status === 'present' && !(r as any).isAbsent;
        if (statusFilter === 'leave') matchesStatus = r.status === 'leave' && !(r as any).isAbsent;
        if (statusFilter === 'absent') matchesStatus = (r as any).isAbsent;

        return matchesSearch && matchesClass && matchesStatus;
    });

    const handleExport = async () => {
        if (filteredRecords.length === 0) {
            toast.error("No records to export matching current filters.");
            return;
        }
        const toastId = toast.loading("Generating Excel Report...");
        try {
            const ExcelJS = (await import('exceljs')).default || await import('exceljs');
            const { saveAs } = (await import('file-saver')).default || await import('file-saver');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Attendance Report');
            worksheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Student Name', key: 'name', width: 25 },
                { header: 'Class', key: 'class', width: 10 },
                { header: 'Roll No', key: 'roll', width: 10 },
                { header: 'Gr No', key: 'gr', width: 12 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Time', key: 'time', width: 12 },
                { header: 'Reason', key: 'reason', width: 25 },
            ];
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 30;
            filteredRecords.forEach(record => {
                const row = worksheet.addRow({
                    date: record.date,
                    name: record.studentName,
                    class: record.class,
                    roll: record.rollNumber,
                    gr: record.grNumber,
                    status: (record as any).isAbsent ? 'Absent' : record.status.charAt(0).toUpperCase() + record.status.slice(1),
                    time: record.timestamp ? formatTime(record.timestamp) : '-',
                    reason: record.reason || '-'
                });
                const statusCell = row.getCell('status');
                const statusText = statusCell.value?.toString().toLowerCase();
                if (statusText === 'absent') statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
                else if (statusText === 'present') statusCell.font = { color: { argb: 'FF059669' }, bold: true };
                else if (statusText === 'leave') statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
                ['class', 'roll', 'gr', 'status', 'time'].forEach(key => {
                    row.getCell(key).alignment = { horizontal: 'center' };
                });
            });
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const dateStr = viewMode === 'daily' ? selectedDate : viewMode === 'monthly' ? selectedMonth : `${dateRange.start}_to_${dateRange.end}`;
            const fileName = `Attendance_${viewMode}_${dateStr}_${filterClass === 'All' ? 'All_Classes' : filterClass.replace(/\s+/g, '_')}.xlsx`;
            saveAs(blob, fileName);
            toast.success("Export successful!", { id: toastId });
        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Failed to export. Check console for details.", { id: toastId });
        }
    };

    const presentCount = records.filter(r => r.status === 'present' && !(r as any).isAbsent).length;
    const leaveCount = records.filter(r => r.status === 'leave' && !(r as any).isAbsent).length;
    const absentCount = records.filter(r => (r as any).isAbsent).length;

    return (
        <div className="space-y-6">
            <AttendanceStats
                allStudentsCount={allStudents.length}
                presentCount={presentCount}
                leaveCount={leaveCount}
                absentCount={absentCount}
            />

            <AttendanceFilters
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                dateRange={dateRange}
                setDateRange={setDateRange}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                search={search}
                setSearch={setSearch}
                filterClass={filterClass}
                setFilterClass={setFilterClass}
                classOptions={classOptions}
                handleExport={handleExport}
                loading={loading}
                presentCount={presentCount}
                leaveCount={leaveCount}
                absentCount={absentCount}
                filteredCount={filteredRecords.length}
            />

            {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
                        <Search size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 tracking-tight">No Records Found</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        We couldn't find any attendance records matching your current filters.
                    </p>
                </div>
            ) : (
                <>
                    <AttendanceTable records={filteredRecords} formatTime={formatTime} />
                    <AttendanceCardList records={filteredRecords} formatTime={formatTime} />
                </>
            )}
        </div>
    );
};

export default AdminMobileAttendance;

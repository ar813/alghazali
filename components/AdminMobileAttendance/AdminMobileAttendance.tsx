"use client";

import React, { useEffect, useState } from 'react';
import PremiumLoader from '@/components/ui/PremiumLoader';
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
import { useSession } from '@/context/SessionContext';

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
    const { selectedSession } = useSession();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('All');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'leave' | 'absent'>('all');
    const [holidays, setHolidays] = useState<Record<string, string>>({});

    // Dummy classes for filter - can be dynamic if needed
    const classOptions = ['All', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'SSCI', 'SSCII'];

    // Fetch all students from Sanity for absent calculation
    useEffect(() => {
        const fetchAllStudents = async () => {
            try {
                if (!selectedSession) return;
                const students = await client.fetch<Student[]>(getAllStudentsQuery, { session: selectedSession });
                setAllStudents(students);
            } catch (error) {
                console.error("❌ Error fetching all students from Sanity:", error);
            }
        };
        fetchAllStudents();
    }, [selectedSession]);

    // Fetch Holidays
    useEffect(() => {
        const fetchHolidays = () => {
            try {
                const q = query(collection(db, 'holidays'));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const h: Record<string, string> = {};
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        let dateKey = '';
                        if (data.date) {
                            if (typeof data.date === 'string') {
                                dateKey = data.date;
                            } else if (data.date?.toDate) {
                                // Handle Firestore Timestamp
                                const d = data.date.toDate();
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                dateKey = `${yyyy}-${mm}-${dd}`;
                            }
                        }
                        if (dateKey && data.title) {
                            h[dateKey] = data.title;
                        }
                    });
                    setHolidays(h);
                });
                return unsubscribe;
            } catch (e) {
                console.error("Error fetching holidays:", e);
            }
        };
        const unsub = fetchHolidays();
        return () => { if (unsub) unsub(); };
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
        if (filteredRecords.length === 0 && allStudents.length === 0) {
            toast.error("No data available to export.");
            return;
        }

        const toastId = toast.loading("Generating Enterprise Register Report...");

        try {
            const ExcelJS = (await import('exceljs')).default || await import('exceljs');
            const { saveAs } = (await import('file-saver')).default || await import('file-saver');
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Al-Ghazali Admin';
            workbook.created = new Date();

            // Function to generate all dates in a month
            const getDaysInMonth = (year: number, month: number) => {
                const date = new Date(year, month - 1, 1);
                const days: string[] = [];
                while (date.getMonth() === month - 1) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    days.push(`${y}-${m}-${d}`);
                    date.setDate(date.getDate() + 1);
                }
                return days;
            };

            // Register Style Logic
            if (viewMode === 'monthly' || viewMode === 'custom') {
                let targetMonths: string[] = [];

                if (viewMode === 'monthly' && selectedMonth) {
                    targetMonths = [selectedMonth];
                } else if (viewMode === 'custom' && dateRange.start && dateRange.end) {
                    // Logic to find all months between start and end
                    const start = new Date(dateRange.start);
                    const end = new Date(dateRange.end);
                    const current = new Date(start.getFullYear(), start.getMonth(), 1);
                    while (current <= end) {
                        const mStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                        if (!targetMonths.includes(mStr)) targetMonths.push(mStr);
                        current.setMonth(current.getMonth() + 1);
                    }
                }

                if (targetMonths.length === 0) {
                    toast.error("Please select a valid date range.", { id: toastId });
                    return;
                }

                for (const monthKey of targetMonths) {
                    const [yearStr, monthStr] = monthKey.split('-');
                    const fullMonthDates = getDaysInMonth(parseInt(yearStr), parseInt(monthStr));

                    const sheetName = new Date(parseInt(yearStr), parseInt(monthStr) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
                    const worksheet = workbook.addWorksheet(sheetName);

                    // --- HEADERS ---
                    const topHeaders = ['SR', 'GR No', 'Roll No', 'Student Name'];
                    const dayHeaders = fullMonthDates.map(d => parseInt(d.split('-')[2])); // 1, 2, 3...
                    const summaryHeaders = ['Total P', 'Total A', 'Total L', '%'];
                    const allHeaders = [...topHeaders, ...dayHeaders, ...summaryHeaders];

                    const headerRow = worksheet.addRow(allHeaders);

                    // Style Header
                    headerRow.eachCell((cell, colNumber) => {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                    headerRow.height = 30;

                    // Column Widths
                    worksheet.getColumn(1).width = 5;  // SR
                    worksheet.getColumn(2).width = 10; // GR
                    worksheet.getColumn(3).width = 8;  // Roll
                    worksheet.getColumn(4).width = 25; // Name
                    // Day columns
                    for (let i = 5; i <= 4 + dayHeaders.length; i++) {
                        worksheet.getColumn(i).width = 4.5;
                    }
                    // Summary columns
                    const sumStart = 5 + dayHeaders.length;
                    for (let i = sumStart; i < sumStart + 4; i++) {
                        worksheet.getColumn(i).width = 9;
                    }

                    // Freeze Panes (First 4 columns and Top 1 row)
                    worksheet.views = [
                        { state: 'frozen', xSplit: 4, ySplit: 1 }
                    ];

                    // --- DATA ROWS ---
                    // Filter students for this class
                    const classStudents = allStudents
                        .filter(s => filterClass === 'All' || s.admissionFor === filterClass || s.admissionFor === `Class ${filterClass}`)
                        .sort((a, b) => {
                            const rollA = a.rollNumber?.toString() || '';
                            const rollB = b.rollNumber?.toString() || '';
                            return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
                        });

                    classStudents.forEach((student, idx) => {
                        const rowData: any[] = [
                            idx + 1,
                            student.grNumber || '-',
                            student.rollNumber || '-',
                            student.fullName
                        ];

                        let pCount = 0;
                        let aCount = 0;
                        let lCount = 0;
                        // Count active days (excluding fully empty columns if needed, but for register we count all school days)
                        // For now we assume Sunday is holiday (automatically marked 'H' or empty but not counted in denominator?)
                        // Let's stick to total days in month for standard reg or active days. 
                        // User wants "poore month k days", so denominator is total days usually, or total working days.
                        let totalWorkingDays = 0;

                        fullMonthDates.forEach(date => {
                            const dayOfWeek = new Date(date).getDay();
                            const isFriday = dayOfWeek === 5; // Friday is holiday

                            if (isFriday) {
                                rowData.push(''); // Empty for Friday
                                // Optionally mark 'F' or gray out
                                return;
                            }
                            totalWorkingDays++;

                            const record = records.find(r => r.grNumber === student.grNumber && r.date === date);

                            if (!record) {
                                // Logic: If no record exists for a working day
                                // Option A: Mark as Absent? 
                                // Option B: Leave empty?
                                // "Generated absents" in useEffect handles this, but only if *someone* took attendance that day.
                                // If NOBODY took attendance (holiday), it's empty.

                                // Let's check if ANYONE has attendance for this date.
                                const anyAttendance = records.some(r => r.date === date);
                                if (anyAttendance) {
                                    // If others have attendance, but this student doesn't -> Absent
                                    rowData.push('A');
                                    aCount++;
                                } else {
                                    // No dataset for this day -> Holiday or no school
                                    rowData.push('-');
                                    // Don't increment working days? Revert above
                                    totalWorkingDays--;
                                }
                            } else if ((record as any).isAbsent) {
                                rowData.push('A');
                                aCount++;
                            } else if (record.status === 'present') {
                                rowData.push('P');
                                pCount++;
                            } else {
                                rowData.push('L');
                                lCount++;
                            }
                        });


                        const percentage = totalWorkingDays > 0
                            ? ((pCount / totalWorkingDays) * 100).toFixed(0) + '%'
                            : '0%';

                        rowData.push(pCount, aCount, lCount, percentage);

                        const row = worksheet.addRow(rowData);

                        // Row Styling
                        row.eachCell((cell, colNumber) => {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
                            cell.font = { size: 9 };
                            cell.border = {
                                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                            };

                            // Student Name Align Left
                            if (colNumber === 4) {
                                cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                                cell.font = { bold: true, size: 9 };
                            }

                            // Conditional Formatting
                            const val = cell.value?.toString();
                            if (colNumber > 4 && colNumber <= 4 + fullMonthDates.length) {
                                // Date columns
                                const dateIdx = colNumber - 5;
                                const currentDate = fullMonthDates[dateIdx];
                                const isFri = new Date(currentDate).getDay() === 5;

                                if (isFri) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; // Gray for Friday
                                }

                                if (val === 'P') {
                                    cell.font = { color: { argb: 'FF059669' }, bold: true }; // Green
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
                                }
                                if (val === 'A') {
                                    cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
                                }
                                if (val === 'L') {
                                    cell.font = { color: { argb: 'FFD97706' }, bold: true }; // Orange
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } };
                                }
                            }
                        });
                    });

                    // FOOTER TOTALS
                    const footerRow = worksheet.addRow([]);
                    footerRow.getCell(4).value = 'DAILY ATTENDANCE';
                    footerRow.getCell(4).font = { bold: true, size: 9 };
                    footerRow.getCell(4).alignment = { horizontal: 'right' };

                    fullMonthDates.forEach((date, i) => {
                        const colIdx = 5 + i;
                        const isFri = new Date(date).getDay() === 5;
                        if (!isFri) {
                            // Calculate column sum P
                            // ExcelJS doesn't support easy formulas for dynamic ranges in JS cleanly without refs, manual calc is safer here
                            // Or leave empty for cleaner look.
                            // Let's put P count
                            const colValues = worksheet.getColumn(colIdx).values.slice(2) as any[]; // skip header + 1 empty
                            const pToday = colValues.filter(v => v === 'P').length;
                            if (pToday > 0) {
                                footerRow.getCell(colIdx).value = pToday;
                                footerRow.getCell(colIdx).font = { bold: true, size: 8, color: { argb: 'FF6B7280' } };
                                footerRow.getCell(colIdx).alignment = { horizontal: 'center' };
                            }
                        }
                    });
                }

            } else {
                // DAILY EXPORT (Legacy/Standard)
                const worksheet = workbook.addWorksheet('Daily Report');
                // ... (Keep existing Standard Daily Export Logic if preferred, or refactor too)
                // For brevity, using the previous standard logic here but ensuring it works:
                worksheet.columns = [
                    { header: 'Date', key: 'date', width: 15 },
                    { header: 'Student Name', key: 'name', width: 25 },
                    { header: 'Class', key: 'class', width: 10 },
                    { header: 'Roll No', key: 'roll', width: 10 },
                    { header: 'Status', key: 'status', width: 12 },
                    { header: 'Time', key: 'time', width: 12 },
                    { header: 'Reason', key: 'reason', width: 25 },
                ];
                // basic styling...
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true };
                filteredRecords.forEach(r => {
                    worksheet.addRow({
                        date: r.date,
                        name: r.studentName,
                        class: r.class,
                        roll: r.rollNumber,
                        status: (r as any).isAbsent ? 'Absent' : r.status,
                        time: r.timestamp ? formatTime(r.timestamp) : '-',
                        reason: r.reason || '-'
                    });
                });
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            let fileName = `Attendance_`;
            if (viewMode === 'monthly') fileName += `${selectedMonth}_`;
            else if (viewMode === 'custom') fileName += `${dateRange.start}_to_${dateRange.end}_`;
            else fileName += `${selectedDate}_`;

            fileName += `${filterClass === 'All' ? 'Whole_School' : `Class_${filterClass.replace(/\s+/g, '_')}`}.xlsx`;
            saveAs(blob, fileName);
            toast.success("Enterprise Register Generated!", { id: toastId });

        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Failed to generate report.", { id: toastId });
        }
    };

    const presentCount = records.filter(r => r.status === 'present' && !(r as any).isAbsent).length;
    const leaveCount = records.filter(r => r.status === 'leave' && !(r as any).isAbsent).length;
    const absentCount = records.filter(r => (r as any).isAbsent).length;

    if (loading) {
        return <PremiumLoader text="Loading Attendance Register..." />;
    }

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

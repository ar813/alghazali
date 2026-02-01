"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Trophy, Award, User, Star } from 'lucide-react';
import { client } from '@/sanity/lib/client';
import { getAllStudentsQuery } from '@/sanity/lib/queries';
import type { Student } from '@/types/student';

interface PerfectStudent {
    grNumber: string;
    fullName: string;
    class: string;
    rollNumber: string;
    attendanceCount: number;
    photoUrl?: string;
}

const HonorRoll = () => {
    const [perfectStudents, setPerfectStudents] = useState<PerfectStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalSchoolDays, setTotalSchoolDays] = useState(0);

    useEffect(() => {
        const fetchHonorRoll = async () => {
            setLoading(true);
            try {
                // 1. Get all students from Sanity
                const students = await client.fetch<Student[]>(getAllStudentsQuery);

                // 2. Get all attendance records for the current year
                const currentYear = new Date().getFullYear();
                const startOfYear = `${currentYear}-01-01`;

                const q = query(
                    collection(db, 'daily_attendance'),
                    where("date", ">=", startOfYear)
                );

                const snapshot = await getDocs(q);
                const attendanceData = snapshot.docs.map(doc => doc.data());

                // 3. Identify unique "Active School Days"
                const activeDays = new Set(attendanceData.map(d => d.date));
                const totalDays = activeDays.size;
                setTotalSchoolDays(totalDays);

                if (totalDays === 0) {
                    setPerfectStudents([]);
                    setLoading(false);
                    return;
                }

                // 4. Count attendance per student (Present or Leave counts as "Not Absent")
                const counts: Record<string, number> = {};
                attendanceData.forEach(rec => {
                    const gr = rec.grNumber;
                    if (gr) {
                        counts[gr] = (counts[gr] || 0) + 1;
                    }
                });

                // 5. Filter students who attended EVERY active day
                const honors = students
                    .filter(s => counts[s.grNumber || ''] === totalDays)
                    .map(s => ({
                        grNumber: s.grNumber || '',
                        fullName: s.fullName,
                        class: s.admissionFor,
                        rollNumber: s.rollNumber,
                        attendanceCount: counts[s.grNumber || ''],
                        photoUrl: s.photoUrl
                    }));

                setPerfectStudents(honors);
            } catch (error) {
                console.error("Error fetching honor roll:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHonorRoll();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-6 w-48 bg-gray-100 rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-gray-100 rounded" />
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (perfectStudents.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Trophy size={180} />
            </div>
            <div className="absolute -bottom-10 -left-10 opacity-10">
                <Star size={120} fill="white" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                        <Award className="text-yellow-300" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">Honor Roll {new Date().getFullYear()}</h3>
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-widest">Perfect Attendance ({totalSchoolDays} Days)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {perfectStudents.slice(0, 6).map((student, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 rounded-2xl p-4 transition-all duration-300 flex items-center gap-4 group/item cursor-default">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-white/30 shadow-lg overflow-hidden flex-shrink-0">
                                {student.photoUrl ? (
                                    <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{student.fullName}</p>
                                <p className="text-[10px] text-blue-100 uppercase font-black tracking-tighter">
                                    Class {student.class} • Roll {student.rollNumber}
                                </p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <Star size={16} className="text-yellow-300 fill-yellow-300" />
                            </div>
                        </div>
                    ))}
                    {perfectStudents.length > 6 && (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-center italic text-xs text-blue-100">
                            + {perfectStudents.length - 6} more students
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HonorRoll;

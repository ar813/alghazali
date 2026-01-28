"use client";
import React, { useState, useEffect } from 'react';
import { User, FileText, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import type { Student } from '@/types/student';
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery } from "@/sanity/lib/queries";

// Helpers
const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '').slice(0, 13);
const formatCnic = (s: string) => {
    const d = onlyDigits(s);
    const p1 = d.slice(0, 5);
    const p2 = d.slice(5, 12);
    const p3 = d.slice(12, 13);
    if (d.length <= 5) return p1;
    if (d.length <= 12) return `${p1}-${p2}`;
    return `${p1}-${p2}-${p3}`;
};

interface StudentLoginFormProps {
    onLoginSuccess: (student: Student) => void;
}

const StudentLoginForm = ({ onLoginSuccess }: StudentLoginFormProps) => {
    const [bForm, setBForm] = useState('');
    const [grNumber, setGrNumber] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await client.fetch(getAllStudentsQuery);
                setStudents(data);
            } catch {
                setError("Database connection error. Please refresh.");
            }
        };
        fetchStudents();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const cleanBForm = onlyDigits(bForm);
        const cleanGr = grNumber.trim();

        if (!cleanBForm || !cleanGr) {
            setError('Please enter both CNIC and GR Number.');
            setIsLoading(false);
            return;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const result = students.filter((s: Student) => {
                const docId = onlyDigits(String((s as any).cnicOrBform ?? ''));
                const guardian = onlyDigits(String((s as any).guardianCnic ?? ''));
                const father = onlyDigits(String((s as any).fatherCnic ?? ''));
                const gr = String((s as any).grNumber ?? '').trim();
                return (docId === cleanBForm || guardian === cleanBForm || father === cleanBForm) && gr === cleanGr;
            });

            if (result.length > 0) {
                const student = result[0];
                const payload = { timestamp: Date.now(), bFormOrCnic: cleanBForm, grNumber: cleanGr };
                localStorage.setItem('studentSession', JSON.stringify(payload));
                if (student._id) {
                    try { localStorage.setItem('studentId', String(student._id)) } catch { }
                }
                onLoginSuccess(student);
            } else {
                setError('No record found with provided details.');
            }
        } catch {
            setError('Verification service unavailable.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleVerify} className="space-y-6">
            {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle size={18} className="shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.1em] ml-1">Identity (CNIC / B-Form)</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-emerald-600 transition-colors">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        value={bForm}
                        onChange={(e) => setBForm(formatCnic(e.target.value))}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-300 shadow-sm"
                        placeholder="42101-XXXXXXX-X"
                        maxLength={15}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.1em] ml-1">Academic GR Number</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-emerald-600 transition-colors">
                        <FileText size={18} />
                    </div>
                    <input
                        type="text"
                        value={grNumber}
                        onChange={(e) => setGrNumber(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-300 shadow-sm"
                        placeholder="e.g. 10245"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || students.length === 0}
                className="w-full py-4 rounded-xl bg-neutral-900 dark:bg-emerald-600 hover:bg-neutral-800 dark:hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Verifying Student Card...</span>
                    </>
                ) : (
                    <>
                        <span>Access Student Portal</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>

            <p className="text-center text-[10px] font-bold text-neutral-400 uppercase tracking-[0.05em] pt-2">
                Official Institutional Access Only
            </p>
        </form>
    );
};

export default StudentLoginForm;

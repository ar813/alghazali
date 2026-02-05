"use client";
import React, { useState } from 'react';
import { User, FileText, AlertCircle, ArrowRight, Loader2, ShieldCheck, Fingerprint } from 'lucide-react';
import type { Student } from '@/types/student';
import { client } from "@/sanity/lib/client";
import { cn } from "@/lib/utils";

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
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const cleanBForm = onlyDigits(bForm);
        const formattedBForm = formatCnic(bForm);
        const cleanGr = grNumber.trim();

        if (!cleanBForm || !cleanGr) {
            setError('Please enter both CNIC and GR Number.');
            setIsLoading(false);
            return;
        }

        try {
            // TARGETED FETCH: Match plain digits OR dashed version
            const query = `*[_type == "student" && (
                cnicOrBform == $plainIdentity || cnicOrBform == $formattedIdentity ||
                fatherCnic == $plainIdentity || fatherCnic == $formattedIdentity ||
                guardianCnic == $plainIdentity || guardianCnic == $formattedIdentity
            ) && grNumber == $grNumber][0]{
                _id,
                fullName,
                fatherName,
                fatherCnic,
                dob,
                rollNumber,
                grNumber,
                gender,
                admissionFor,
                nationality,
                medicalCondition,
                cnicOrBform,
                email,
                phoneNumber,
                whatsappNumber,
                address,
                formerEducation,
                previousInstitute,
                lastExamPercentage,
                guardianName,
                guardianContact,
                guardianCnic,
                guardianRelation,
                issueDate,
                expiryDate,
                session,
                "photoUrl": photo.asset->url
            }`;

            const student = await client.fetch(query, {
                plainIdentity: cleanBForm,
                formattedIdentity: formattedBForm,
                grNumber: cleanGr
            });

            if (student) {
                const payload = {
                    timestamp: Date.now(),
                    bFormOrCnic: cleanBForm,
                    grNumber: cleanGr,
                    _id: student._id,
                    session: student.session
                };
                localStorage.setItem('studentSession', JSON.stringify(payload));
                if (student._id) {
                    try { localStorage.setItem('studentId', String(student._id)) } catch { }
                }
                onLoginSuccess(student);
            } else {
                setError('No record found with provided details. Please check your CNIC/B-Form and GR Number.');
            }
        } catch (err: any) {
            console.error('Portal Login Error:', err);
            setError('Database connection error. Please check your internet and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleVerify} className="space-y-7 relative">
            {/* Subtle ambient glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Error Alert */}
            {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20 shrink-0">
                            <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300 leading-tight">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Identity Field */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em] ml-1">
                    <Fingerprint size={12} className="text-emerald-500" />
                    Student Identity
                </label>
                <div className={cn(
                    "relative group rounded-2xl transition-all duration-300",
                    focusedField === 'bForm' && "ring-2 ring-emerald-500/20"
                )}>
                    <div className={cn(
                        "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300",
                        focusedField === 'bForm' ? "text-emerald-500" : "text-neutral-400"
                    )}>
                        <User size={18} strokeWidth={2.5} />
                    </div>
                    <input
                        type="text"
                        value={bForm}
                        onChange={(e) => setBForm(formatCnic(e.target.value))}
                        onFocus={() => setFocusedField('bForm')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/50 transition-all duration-300 font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-[15px]"
                        placeholder="42101-XXXXXXX-X"
                        maxLength={15}
                        required
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <span className="text-[10px] font-bold text-neutral-300 dark:text-neutral-700 uppercase tracking-wider">CNIC / B-Form</span>
                    </div>
                </div>
            </div>

            {/* GR Number Field */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em] ml-1">
                    <FileText size={12} className="text-emerald-500" />
                    Academic Registration
                </label>
                <div className={cn(
                    "relative group rounded-2xl transition-all duration-300",
                    focusedField === 'grNumber' && "ring-2 ring-emerald-500/20"
                )}>
                    <div className={cn(
                        "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300",
                        focusedField === 'grNumber' ? "text-emerald-500" : "text-neutral-400"
                    )}>
                        <FileText size={18} strokeWidth={2.5} />
                    </div>
                    <input
                        type="text"
                        value={grNumber}
                        onChange={(e) => setGrNumber(e.target.value)}
                        onFocus={() => setFocusedField('grNumber')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/50 transition-all duration-300 font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-[15px]"
                        placeholder="e.g. 10245"
                        required
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <span className="text-[10px] font-bold text-neutral-300 dark:text-neutral-700 uppercase tracking-wider">GR Number</span>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                        "w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 group flex items-center justify-center gap-3",
                        "bg-neutral-950 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-500",
                        "hover:bg-neutral-900 dark:hover:from-emerald-500 dark:hover:to-emerald-400",
                        "text-white shadow-2xl shadow-neutral-950/20 dark:shadow-emerald-500/25",
                        "active:scale-[0.98]",
                        "disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Authenticating...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={18} />
                            <span>Access Portal</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                        </>
                    )}
                </button>
            </div>

            {/* Footer Badge */}
            <div className="flex flex-col items-center gap-3 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-[1px] bg-gradient-to-r from-transparent to-neutral-300 dark:to-neutral-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-neutral-300 dark:to-neutral-700" />
                </div>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.2em] text-center">
                    Secure Student Access
                </p>
            </div>
        </form>
    );
};

export default StudentLoginForm;


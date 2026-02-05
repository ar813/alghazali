"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Zap,
    RefreshCcw,
    X,
    Loader2
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { client } from '@/sanity/lib/client';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';

// Standard Class Order for Sorting
const CLASS_ORDER = ['PG', 'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', 'SSCI', 'SSCII'];

const sortClasses = (a: string, b: string) => {
    const idxA = CLASS_ORDER.indexOf(a);
    const idxB = CLASS_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
};

interface StudentPromotionProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface ClassStat {
    className: string;
    count: number;
}

const StudentPromotion = ({ onClose, onSuccess }: StudentPromotionProps) => {
    const { sessions, selectedSession } = useSession();
    const [step, setStep] = useState(1);
    const [sourceSession, setSourceSession] = useState('');
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [classStats, setClassStats] = useState<ClassStat[]>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    // Load classes for mapping
    useEffect(() => {
        if (sourceSession) {
            setIsLoadingClasses(true);
            // Robust query handling undefined sessions for legacy data (2025-2026 default)
            const query = `*[_type == "student" && (session == $session || (!defined(session) && $session == "2025-2026"))] { admissionFor }`;

            client.fetch(query, { session: sourceSession }).then((data: any[]) => {
                // Aggregate counts
                const statsMap: Record<string, number> = {};
                data.forEach(s => {
                    const cls = s.admissionFor || 'Unassigned';
                    statsMap[cls] = (statsMap[cls] || 0) + 1;
                });

                const statsArray = Object.entries(statsMap).map(([className, count]) => ({
                    className,
                    count
                })).sort((a, b) => sortClasses(a.className, b.className));

                setClassStats(statsArray);

                // Auto-generate mapping
                const initialMapping: Record<string, string> = {};
                statsArray.forEach(({ className }) => {
                    const idx = CLASS_ORDER.indexOf(className);
                    if (idx !== -1 && idx + 1 < CLASS_ORDER.length) {
                        initialMapping[className] = CLASS_ORDER[idx + 1];
                    } else {
                        initialMapping[className] = className; // Keep same if unknown or last
                    }
                });
                setMapping(initialMapping);
                setIsLoadingClasses(false);
            }).catch(err => {
                console.error(err);
                toast.error("Failed to load classes");
                setIsLoadingClasses(false);
            });
        }
    }, [sourceSession]);

    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/students/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sourceSession,
                    targetSession: selectedSession,
                    mapping
                })
            });

            const json = await res.json();
            if (json.ok) {
                toast.success(json.message || 'Promotion successful!');
                onSuccess();
                setStep(4);
            } else {
                throw new Error(json.error || 'Failed to promote students');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsExecuting(false);
        }
    };

    const totalStudentsToPromote = classStats.reduce((acc, curr) => {
        return mapping[curr.className] ? acc + curr.count : acc;
    }, 0);

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Source Session</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Select the academic term you want to promote students <strong>from</strong>.
                </p>
            </div>

            <div className="grid gap-3">
                {sessions.filter(s => s !== selectedSession).map(s => (
                    <div
                        key={s}
                        onClick={() => setSourceSession(s)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 ${sourceSession === s
                            ? 'border-black bg-neutral-50 dark:border-white dark:bg-neutral-900 ring-1 ring-black dark:ring-white'
                            : 'border-neutral-200 dark:border-neutral-800'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{s}</span>
                            {sourceSession === s && <CheckCircle2 size={16} />}
                        </div>
                    </div>
                ))}
                {sessions.filter(s => s !== selectedSession).length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl">
                        <RefreshCcw className="text-neutral-300 mb-2" />
                        <p className="text-sm text-neutral-500">No other sessions available.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    disabled={!sourceSession}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                >
                    Continue
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Class Mapping</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Review and adjust how classes will be promoted to <strong>{selectedSession}</strong>.
                </p>
            </div>

            {isLoadingClasses ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                    <p className="text-sm text-neutral-500">Fetching class data...</p>
                </div>
            ) : classStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-dashed text-center p-6 border-neutral-200 dark:border-neutral-800">
                    <AlertCircle className="h-10 w-10 text-neutral-400 mb-3" />
                    <p className="font-medium text-neutral-900 dark:text-white">No students found</p>
                    <p className="text-sm text-neutral-500 mt-1">Try selecting a different session.</p>
                </div>
            ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 font-medium border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 bg-neutral-100 dark:bg-neutral-900">From Class</th>
                                <th className="px-4 py-3 text-center bg-neutral-100 dark:bg-neutral-900">Students</th>
                                <th className="px-4 py-3 bg-neutral-100 dark:bg-neutral-900">Promote To</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {classStats.map((stat) => (
                                <tr key={stat.className} className="bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{stat.className}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                                            {stat.count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={mapping[stat.className] || ''}
                                            onChange={(e) => setMapping({ ...mapping, [stat.className]: e.target.value })}
                                            className="w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-900 dark:text-white"
                                        >
                                            <option value="" className="dark:bg-neutral-900">Do Not Promote</option>
                                            {CLASS_ORDER.map(cls => (
                                                <option key={cls} value={cls} className="dark:bg-neutral-900">{cls}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex justify-between pt-2">
                <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-neutral-200 dark:border-neutral-800 bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-900 dark:text-white"
                >
                    Back
                </button>
                <button
                    onClick={() => setStep(3)}
                    disabled={totalStudentsToPromote === 0}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50"
                >
                    Review
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">Confirm Promotion</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    You are about to promote <span className="font-bold text-neutral-900 dark:text-white">{totalStudentsToPromote} students</span> to the <span className="font-bold text-neutral-900 dark:text-white">{selectedSession}</span> session.
                </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-neutral-500 mb-2">Summary</h4>
                <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {classStats.filter(s => mapping[s.className]).map(s => (
                        <div key={s.className} className="flex justify-between items-center py-1 border-b border-dashed last:border-0 border-neutral-200 dark:border-neutral-800">
                            <span className="text-neutral-600 dark:text-neutral-400">
                                Class {s.className} <ArrowRight className="inline w-3 h-3 mx-1" /> Class {mapping[s.className]}
                            </span>
                            <span className="font-medium text-neutral-900 dark:text-white">+{s.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    onClick={() => setStep(2)}
                    className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium border border-neutral-200 dark:border-neutral-800 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-900 h-10 px-4 py-2 text-neutral-900 dark:text-white"
                >
                    Back
                </button>
                <button
                    disabled={isExecuting}
                    onClick={handleExecute}
                    className="flex-[2] inline-flex items-center justify-center rounded-md text-sm font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-90 h-10 px-4 py-2 disabled:opacity-50"
                >
                    {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isExecuting ? 'Promoting...' : 'Confirm Promotion'}
                </button>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Success!</h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Students have been successfully promoted and transferred to the new session.
                </p>
            </div>
            <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-90 h-10 px-8 py-2"
            >
                Close
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-950 w-full max-w-lg rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                {step < 4 && (
                    <div className="flex items-center justify-between p-6 pb-2 border-b border-neutral-100 dark:border-neutral-900">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Promotion Wizard</h2>
                        <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="p-6 pt-6 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                            {step === 4 && renderSuccess()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentPromotion;

import React, { useEffect, useState, useMemo } from 'react';
import { Users, FileBarChart2, Activity, TrendingUp, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import { client } from '@/sanity/lib/client';
import { getAllStudentsQuery } from '@/sanity/lib/queries';
import StatCard from './subcomponents/StatCard';
import QuickActions from './subcomponents/QuickActions';
import DashboardInsights from './subcomponents/DashboardInsights';
import SystemStatus from './subcomponents/SystemStatus';

const AdminDashboard = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    // Stats
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [students, setStudents] = useState<any[]>([]);
    const [totalQuizzes, setTotalQuizzes] = useState<number>(0);
    const [resultsLast30, setResultsLast30] = useState<number>(0);
    const [totalNotices, setTotalNotices] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [health, setHealth] = useState<{ ok?: boolean; issues?: string[]; missingEnv?: string[] } | null>(null);

    // Data fetching for dashboard
    useEffect(() => {
        const fetchStats = async () => {
            onLoadingChange?.(true);
            setLoading(true);
            setError(null);
            try {
                // Fetch Total Students from Sanity
                try {
                    const list: any[] = await client.fetch(getAllStudentsQuery);
                    setStudents(Array.isArray(list) ? list : []);
                    setTotalStudents(Array.isArray(list) ? list.length : 0);
                } catch {
                    const res = await fetch('/api/stats');
                    const json = await res.json().catch(() => ({}));
                    const data = json?.data || {};
                    setTotalStudents(data.totalStudents || 0);
                }

                // Load other stats
                const res = await fetch('/api/stats');
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.details || err?.error || `HTTP ${res.status}`);
                }
                const json = await res.json();
                const data = json?.data || {};
                setTotalQuizzes(data.totalQuizzes || 0);
                setTotalNotices(data.totalNotices || 0);

                // Compute Announced Results (last 30 days)
                try {
                    const r = await fetch('/api/quiz-results?lastDays=30&limit=1000', { cache: 'no-store' });
                    const jr = await r.json();
                    const list = Array.isArray(jr?.data) ? jr.data : [];
                    const ids = new Set<string>();
                    for (const it of list) {
                        const qid = it?.quiz?._id;
                        const announced = !!it?.quiz?.resultsAnnounced;
                        if (qid && announced) ids.add(String(qid));
                    }
                    setResultsLast30(ids.size);
                } catch {
                    setResultsLast30(0);
                }

                // Fetch health status
                try {
                    const h = await fetch('/api/health', { cache: 'no-store' });
                    const hj = await h.json().catch(() => ({}));
                    setHealth(hj || null);
                } catch {
                    setHealth(null);
                }
            } catch (e: any) {
                setError(e?.message || 'Failed to load stats');
            } finally {
                onLoadingChange?.(false);
                setLoading(false);
            }
        };
        fetchStats();
    }, [onLoadingChange]);

    // Derived insights
    const insights = useMemo(() => {
        const uniqClasses = new Set<string>();
        let male = 0, female = 0;
        let medicalYes = 0;
        let withPhoto = 0;
        const classMap = new Map<string, number>();
        for (const s of students) {
            const cls = (s?.admissionFor || '—').toString();
            uniqClasses.add(cls);
            classMap.set(cls, (classMap.get(cls) || 0) + 1);
            const g = (s?.gender || '').toString().toLowerCase();
            if (g === 'male') male++;
            if (g === 'female') female++;
            if ((s?.medicalCondition || '').toString().toLowerCase() === 'yes') medicalYes++;
            if (s?.photoUrl || s?.imageUrl) withPhoto++;
        }
        const topClasses = Array.from(classMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][];
        return { uniqClassCount: uniqClasses.size, male, female, medicalYes, withPhoto, topClasses };
    }, [students]);

    const handleActionClick = (id: string) => {
        if (typeof window !== 'undefined') window.location.hash = id;
    };

    const statsConfig = [
        { title: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, color: '' },
        { title: 'Unique Classes', value: (insights.uniqClassCount || 0).toString(), icon: FileBarChart2, color: '' },
        { title: 'Male', value: (insights.male || 0).toLocaleString(), icon: Activity, color: '' },
        { title: 'Female', value: (insights.female || 0).toLocaleString(), icon: Activity, color: '' },
        { title: 'Medical Cases', value: (insights.medicalYes || 0).toLocaleString(), icon: ShieldCheck, color: '' },
        { title: 'Photos Available', value: (insights.withPhoto || 0).toLocaleString(), icon: TrendingUp, color: '' },
        { title: 'Total Quizzes', value: totalQuizzes.toLocaleString(), icon: Calendar, color: '' },
        { title: 'Announced Results', value: resultsLast30.toLocaleString(), icon: Sparkles, color: '' },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">
            {error && (
                <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-3 text-sm">
                    Failed to load stats: {error}
                </div>
            )}

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="h-3 w-28 bg-gray-200 rounded mb-3" />
                                    <div className="h-6 w-20 bg-gray-200 rounded" />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                            </div>
                        </div>
                    ))
                ) : (
                    statsConfig.map((stat, i) => <StatCard key={i} stat={stat} />)
                )}
            </div>

            <QuickActions onActionClick={handleActionClick} />

            <DashboardInsights
                topClasses={insights.topClasses}
                totalStudents={totalStudents}
                totalNotices={totalNotices}
                onNoticeClick={() => handleActionClick('notice')}
            />

            <SystemStatus health={health} />
        </div>
    );
};

export default AdminDashboard;
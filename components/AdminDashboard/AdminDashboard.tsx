import { Users, TrendingUp, Calendar, Sparkles, Activity, ShieldCheck, Wrench, UserCog, FileBarChart2, Bell, Megaphone } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'

const AdminDashboard = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    // Stats
    const [totalStudents, setTotalStudents] = useState<number>(0)
    const [students, setStudents] = useState<any[]>([])
    const [totalQuizzes, setTotalQuizzes] = useState<number>(0)
    const [resultsLast30, setResultsLast30] = useState<number>(0)
    const [totalNotices, setTotalNotices] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [health, setHealth] = useState<{ ok?: boolean; issues?: string[]; missingEnv?: string[] } | null>(null)

    // Data fetching for dashboard
    useEffect(() => {
        const fetchStats = async () => {
            onLoadingChange?.(true)
            setLoading(true)
            setError(null)
            try {
                // Prefer direct Sanity fetch for accurate Total Students (same as AdminReports)
                try {
                    const list: any[] = await client.fetch(getAllStudentsQuery)
                    setStudents(Array.isArray(list) ? list : [])
                    setTotalStudents(Array.isArray(list) ? list.length : 0)
                } catch {
                    // Fallback to stats API if direct fetch fails
                    const res = await fetch('/api/stats')
                    const json = await res.json().catch(() => ({}))
                    const data = json?.data || {}
                    setTotalStudents(data.totalStudents || 0)
                }

                // Load other stats from /api/stats (non-blocking for total students which is already set)
                const res = await fetch('/api/stats')
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err?.details || err?.error || `HTTP ${res.status}`)
                }
                const json = await res.json()
                const data = json?.data || {}
                setTotalQuizzes(data.totalQuizzes || 0)
                setTotalNotices(data.totalNotices || 0)

                // Compute Announced Results (last 30 days) by filtering announced only
                try {
                    const r = await fetch('/api/quiz-results?lastDays=30&limit=1000', { cache: 'no-store' })
                    const jr = await r.json()
                    const list = Array.isArray(jr?.data) ? jr.data : []
                    // Count per-quiz (unique quiz IDs) where quiz.resultsAnnounced is true
                    const ids = new Set<string>()
                    for (const it of list) {
                        const qid = it?.quiz?._id
                        const announced = !!it?.quiz?.resultsAnnounced
                        if (qid && announced) ids.add(String(qid))
                    }
                    setResultsLast30(ids.size)
                } catch {
                    setResultsLast30(0)
                }
                // Try health (non-blocking)
                try {
                    const h = await fetch('/api/health', { cache: 'no-store' })
                    const hj = await h.json().catch(() => ({}))
                    setHealth(hj || null)
                } catch {
                    setHealth(null)
                }
            } catch (e: any) {
                setError(e?.message || 'Failed to load stats')
            } finally {
                onLoadingChange?.(false)
                setLoading(false)
            }
        }
        fetchStats()
    }, [onLoadingChange])

    // Derived insights
    const insights = React.useMemo(() => {
        const uniqClasses = new Set<string>()
        let male = 0, female = 0
        let medicalYes = 0
        let withPhoto = 0
        const classMap = new Map<string, number>()
        for (const s of students as any[]) {
            const cls = (s?.admissionFor || '—').toString()
            uniqClasses.add(cls)
            classMap.set(cls, (classMap.get(cls) || 0) + 1)
            const g = (s?.gender || '').toString().toLowerCase()
            if (g === 'male') male++
            if (g === 'female') female++
            if ((s?.medicalCondition || '').toString().toLowerCase() === 'yes') medicalYes++
            if (s?.photoUrl || s?.imageUrl) withPhoto++
        }
        const topClasses = Array.from(classMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
        return { uniqClassCount: uniqClasses.size, male, female, medicalYes, withPhoto, topClasses }
    }, [students])

    // Components
    type Stat = { title: string; value: string; icon: React.ElementType; color: string }
    const StatCard = ({ stat }: { stat: Stat }) => (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                        {stat.value}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-100 dark:group-hover:border-indigo-800">
                    <stat.icon className="w-6 h-6 text-neutral-900 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
            </div>
            {/* Subtle progress bar placeholder for SaaS feel */}
            <div className="mt-4 h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500/20 w-[60%] rounded-full" />
            </div>
        </div>
    )


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
                    <>
                        <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="h-3 w-28 bg-gray-200 rounded mb-3" />
                                    <div className="h-6 w-20 bg-gray-200 rounded" />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="h-3 w-28 bg-gray-200 rounded mb-3" />
                                    <div className="h-6 w-20 bg-gray-200 rounded" />
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <StatCard stat={{ title: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, color: '' }} />
                        <StatCard stat={{ title: 'Unique Classes', value: (insights.uniqClassCount || 0).toString(), icon: FileBarChart2, color: '' }} />
                        <StatCard stat={{ title: 'Male', value: (insights.male || 0).toLocaleString(), icon: Activity, color: '' }} />
                        <StatCard stat={{ title: 'Female', value: (insights.female || 0).toLocaleString(), icon: Activity, color: '' }} />
                        <StatCard stat={{ title: 'Medical Cases', value: (insights.medicalYes || 0).toLocaleString(), icon: ShieldCheck, color: '' }} />
                        <StatCard stat={{ title: 'Photos Available', value: (insights.withPhoto || 0).toLocaleString(), icon: TrendingUp, color: '' }} />
                        <StatCard stat={{ title: 'Total Quizzes', value: totalQuizzes.toLocaleString(), icon: Calendar, color: '' }} />
                        <StatCard stat={{ title: 'Announced Results', value: resultsLast30.toLocaleString(), icon: Sparkles, color: '' }} />
                    </>
                )}
            </div>

            {/* Quick Actions - Enterprise Grid */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                        <Wrench size={16} className="text-indigo-500" />
                        Administrative Hub
                    </h3>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                        { id: 'students', label: 'Student Mgmt', icon: UserCog },
                        { id: 'schedule', label: 'Academic Cal', icon: Calendar },
                        { id: 'reports', label: 'Analytics', icon: FileBarChart2 },
                        { id: 'notice', label: 'Broadcasts', icon: Megaphone },
                        { id: 'fees', label: 'Revenue', icon: Sparkles },
                        { id: 'quiz', label: 'Exam Center', icon: Activity },
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => { if (typeof window !== 'undefined') window.location.hash = btn.id }}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-500/5 transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                <btn.icon size={20} className="text-neutral-600 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            </div>
                            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors text-center">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            {/* Top Classes & Notices summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30">
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">Enrollment by Class</h3>
                    </div>
                    <div className="p-6">
                        {insights.topClasses.length === 0 ? (
                            <div className="text-sm text-neutral-500 font-medium italic">No enrollment data available.</div>
                        ) : (
                            <div className="space-y-3">
                                {insights.topClasses.map(([cls, cnt]) => (
                                    <div key={String(cls)} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Class {String(cls)}</span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-1 mx-4">
                                            <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500/40 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (cnt / totalStudents) * 100 * 5)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{cnt}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30 flex items-center justify-between">
                        <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">Notice Center</h3>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-tighter border border-indigo-500/20">Active: {totalNotices}</span>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed italic">
                            All campus-wide announcements and event notices are synchronized automatically. Real-time updates are pushed to student portals upon publication.
                        </p>
                        <button
                            onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'notice' }}
                            className="w-full py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all dark:text-neutral-400 dark:hover:text-indigo-400"
                        >
                            Open Publication Studio
                        </button>
                    </div>
                </div>
            </div>

            {/* System Health Section */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30">
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                        Infrastructure Status
                    </h3>
                </div>
                <div className="p-6">
                    {health ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                                <Activity size={18} className={health.ok ? "text-emerald-500" : "text-rose-500"} />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter leading-none text-neutral-500">Global Status</p>
                                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{health.ok ? 'Operational' : 'Partial Outage'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter leading-none text-neutral-500">Config Audit</p>
                                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{(health.missingEnv || []).length} Missing Vars</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter leading-none text-neutral-500">Security Log</p>
                                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{(health.issues || []).length} Alerts</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-neutral-500 flex items-center gap-2 italic uppercase font-bold tracking-tighter">
                            <Bell size={16} className="text-neutral-400" /> Infrastructure telemetry offline
                        </div>
                    )}
                </div>
            </div>

            {/* Removed: Recent Admissions per request */}
            {/* Removed: non-essential sections */}
        </div>
    )
}

export default AdminDashboard
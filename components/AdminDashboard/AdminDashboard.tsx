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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-gray-300 transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                </div>
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

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2"><Wrench className="text-gray-900" size={18} /> Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'students' }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all font-medium text-sm">
                        <UserCog size={16} /> Students
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'schedule' }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all font-medium text-sm">
                        <Calendar size={16} /> Schedule
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'reports' }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all font-medium text-sm">
                        <FileBarChart2 size={16} /> Reports
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'notice' }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all font-medium text-sm">
                        <Megaphone size={16} /> Notices
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'fees' }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all font-medium text-sm">
                        <Sparkles size={16} /> Fees
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'quiz' }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all font-medium text-sm">
                        <Calendar size={16} /> Quiz
                    </button>
                </div>
            </div>
            {/* Top Classes & Notices summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">Top Classes by Strength</h3>
                    </div>
                    {insights.topClasses.length === 0 ? (
                        <div className="text-sm text-gray-500">No data</div>
                    ) : (
                        <div className="divide-y">
                            {insights.topClasses.map(([cls, cnt]) => (
                                <div key={String(cls)} className="flex items-center justify-between py-2">
                                    <span className="text-gray-700">Class {String(cls)}</span>
                                    <span className="font-semibold">{cnt}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">Notices Overview</h3>
                        <div className="text-sm text-gray-600">Total: {totalNotices.toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-500">Manage notices in the Notice tab. Events are auto-synced to the homepage.</div>
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">System Health</h3>
                </div>
                {health ? (
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-gray-200 text-gray-700">
                            <Activity size={16} className={health.ok ? "text-green-600" : "text-red-600"} /> Status: {health.ok ? 'Operational' : 'Issues found'}
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-200 text-gray-700">
                            Missing ENV: {(health.missingEnv || []).length}
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-200 text-gray-700">
                            Warnings: {(health.issues || []).length}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 flex items-center gap-2"><Bell size={16} className="text-gray-400" /> Health endpoint unavailable or disabled.</div>
                )}
            </div>

            {/* Removed: Recent Admissions per request */}
            {/* Removed: non-essential sections */}
        </div>
    )
}

export default AdminDashboard
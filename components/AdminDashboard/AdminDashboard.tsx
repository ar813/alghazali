import { Users, TrendingUp, Calendar, Sparkles, Activity, ShieldCheck, Wrench, UserCog, FileBarChart2, Bell, Megaphone } from 'lucide-react';
import React, { useEffect, useState } from 'react'

const AdminDashboard = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    // Stats
    const [totalStudents, setTotalStudents] = useState<number>(0)
    const [admissionsLast365, setAdmissionsLast365] = useState<number>(0)
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
                const res = await fetch('/api/stats')
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err?.details || err?.error || `HTTP ${res.status}`)
                }
                const json = await res.json()
                const data = json?.data || {}
                setTotalStudents(data.totalStudents || 0)
                setAdmissionsLast365(data.admissionsLast365 || 0)
                setTotalQuizzes(data.totalQuizzes || 0)
                setResultsLast30(data.resultsLast30 || 0)
                setTotalNotices(data.totalNotices || 0)
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

    // Components
    type Stat = { title: string; value: string; icon: React.ElementType; color: string }
    const StatCard = ({ stat }: { stat: Stat }) => (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1 truncate">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                        <StatCard stat={{ title: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, color: 'from-blue-500 to-purple-600' }} />
                        <StatCard stat={{ title: 'Admissions (365 days)', value: admissionsLast365.toLocaleString(), icon: TrendingUp, color: 'from-pink-500 to-rose-600' }} />
                        <StatCard stat={{ title: 'Total Quizzes', value: totalQuizzes.toLocaleString(), icon: Calendar, color: 'from-violet-500 to-indigo-600' }} />
                        <StatCard stat={{ title: 'Results (30 days)', value: resultsLast30.toLocaleString(), icon: Sparkles, color: 'from-emerald-500 to-teal-600' }} />
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Wrench className="text-blue-600" size={18}/> Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'students' }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <UserCog size={16}/> Manage Students
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'schedule' }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                        <Calendar size={16}/> Schedule
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'reports' }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <FileBarChart2 size={16}/> Reports
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'notice' }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100">
                        <Megaphone size={16}/> Notices
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'fees' }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">
                        <Sparkles size={16}/> Fees
                    </button>
                    <button onClick={() => { if (typeof window !== 'undefined') window.location.hash = 'quiz' }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100">
                        <Calendar size={16}/> Quiz
                    </button>
                </div>
            </div>

            {/* Notices summary */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">Notices Overview</h3>
                    <div className="text-sm text-gray-600">Total: {totalNotices.toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-500">Manage notices in the Notice tab. Events are auto-synced to the homepage.</div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600"/> System Health</h3>
                </div>
                {health ? (
                    <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700">
                            <Activity size={16}/> Status: {health.ok ? 'OK' : 'Issues found'}
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
                            Missing ENV: {(health.missingEnv || []).length}
                        </div>
                        <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
                            Warnings: {(health.issues || []).length}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 flex items-center gap-2"><Bell size={16} className="text-gray-400"/> Health endpoint unavailable or disabled.</div>
                )}
            </div>

            {/* Removed: Recent Admissions per request */}
            {/* Removed: non-essential sections */}
        </div>
    )
}

export default AdminDashboard
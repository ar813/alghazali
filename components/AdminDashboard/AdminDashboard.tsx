import { Users, TrendingUp, Activity, Calendar, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { client } from '@/sanity/lib/client';

const AdminDashboard = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
    // Stats
    const [totalStudents, setTotalStudents] = useState<number>(0)
    const [admissionsLast365, setAdmissionsLast365] = useState<number>(0)
    type RecentAdmission = { _id: string; fullName: string; admissionFor?: string; _createdAt: string }
    const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Data fetching for dashboard
    useEffect(() => {
        const fetchStats = async () => {
            onLoadingChange?.(true)
            setLoading(true)
            // Count total students
            const total: number = await client.fetch('count(*[_type == "student"])')

            // Admissions in last 365 days using _createdAt
            const last365Query = `count(*[_type == "student" && dateTime(_createdAt) >= dateTime(now()) - 60*60*24*365])`
            const last365: number = await client.fetch(last365Query)

            // Recent admissions list (latest 6)
            const recents: RecentAdmission[] = await client.fetch(`*[_type == "student"]|order(_createdAt desc)[0...6]{ _id, fullName, admissionFor, _createdAt }`)

            setTotalStudents(total)
            setAdmissionsLast365(last365)
            setRecentAdmissions(recents)
            onLoadingChange?.(false)
            setLoading(false)
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

    const Section = ({ title, icon: Icon, children, actions }: { title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }) => (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Icon size={18} /> {title}</h3>
                <div className="flex items-center gap-2">{actions}</div>
            </div>
            {children}
        </div>
    )

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Quick Stats (only 2 items kept) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </>
                )}
            </div>

            {/* Quick Actions removed per request */}

            {/* 3. Recent Activity (Admissions) */}
            <Section title="Recent Admissions" icon={Activity} actions={<button onClick={() => window.location.assign('/admin')} className="text-sm text-blue-600 hover:underline">View all</button>}>
                {loading ? (
                    <div className="space-y-2 sm:space-y-3 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-2 sm:py-3 border-b last:border-b-0">
                                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 w-full">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                </div>
                                <div className="h-3 bg-gray-200 rounded w-16" />
                            </div>
                        ))}
                    </div>
                ) : recentAdmissions.length === 0 ? (
                    <div className="text-gray-500 text-sm">No recent admissions</div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {recentAdmissions.map((s) => (
                            <div key={s._id} className="flex items-center justify-between py-2 sm:py-3 border-b last:border-b-0">
                                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-700 text-sm sm:text-base truncate">{s.fullName} • Class {s.admissionFor || '—'}</span>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-500">{new Date(s._createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
            

            {/* Messages and Uploads removed as requested */}

            {/* System Health removed as requested */}

            {/* Charts removed as requested */}

            {/* Pending Approvals removed as requested */}
        </div>
    )
}

export default AdminDashboard
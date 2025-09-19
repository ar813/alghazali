import { GraduationCap, Users, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { client } from '@/sanity/lib/client';

const AdminDashboard = () => {

    const [totalStudents, setTotalStudents] = useState<number>(0)
    const [admissionsLast30, setAdmissionsLast30] = useState<number>(0)
    type RecentAdmission = { _id: string; fullName: string; admissionFor?: string; _createdAt: string }
    const [recentAdmissions, setRecentAdmissions] = useState<RecentAdmission[]>([])

    useEffect(() => {
        const fetchStats = async () => {
            // Count total students
            const total: number = await client.fetch('count(*[_type == "student"])')

            // Admissions in last 30 days using _createdAt
            const last30Query = `count(*[_type == "student" && dateTime(_createdAt) >= dateTime(now()) - 60*60*24*30])`
            const last30: number = await client.fetch(last30Query)

            // Recent admissions list (latest 6)
            const recents: RecentAdmission[] = await client.fetch(`*[_type == "student"]|order(_createdAt desc)[0...6]{ _id, fullName, admissionFor, _createdAt }`)

            setTotalStudents(total)
            setAdmissionsLast30(last30)
            setRecentAdmissions(recents)
        }
        fetchStats()
    }, [])

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
    );


    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard stat={{ title: 'Total Students', value: totalStudents.toLocaleString(), icon: Users, color: 'from-blue-500 to-purple-600' }} />
                <StatCard stat={{ title: 'Faculty Members', value: '—', icon: GraduationCap, color: 'from-orange-500 to-red-600' }} />
                <StatCard stat={{ title: 'Admission Rate (30 days)', value: totalStudents > 0 ? `${Math.round((admissionsLast30 / totalStudents) * 100)}%` : '0%', icon: TrendingUp, color: 'from-pink-500 to-rose-600' }} />
            </div>

            {/* Recent Admissions */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Recent Admissions</h3>
                {recentAdmissions.length === 0 ? (
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
            </div>
        </div>
    )
}

export default AdminDashboard
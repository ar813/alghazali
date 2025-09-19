"use client"

import { CalendarCheck, Clock, GraduationCap } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar/NavBar'
import Footer from '@/components/Footer/Footer'
import { client } from '@/sanity/lib/client'
import { getAllSchedulesQuery } from '@/sanity/lib/queries'

type Period = { subject: string; time: string }
type Day = { day: string; periods: Period[] }
type ScheduleDoc = { className: string; days: Day[] }

async function fetchSchedules(): Promise<ScheduleDoc[]> {
  return await client.fetch(getAllSchedulesQuery)
}

const ClassSchedule = ({ className, schedule }: { className: string; schedule: Day[] }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{className}</h2>
      </div>
      <div className="space-y-4">
        {schedule.map((day, idx) => (
          <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-500" />
              {day.day}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {day.periods.map((period: Period, pIdx: number) => (
                <div key={pIdx} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{period.subject}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{period.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SchedulePage = () => {
  const [schedules, setSchedules] = useState<ScheduleDoc[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchSchedules()
      .then((res) => {
        if (!mounted) return
        setSchedules(res || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || 'Failed to load schedules')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <NavBar />
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Class Schedules
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View detailed class schedules for all grades. Each schedule includes subject timings and daily periods.
            </p>
          </div>

          {loading && (
            <div className="text-center py-20">Loading schedules...</div>
          )}

          {error && (
            <div className="text-center text-red-600">{error}</div>
          )}

          {!loading && !error && schedules && schedules.length === 0 && (
            <div className="text-center py-20">No schedules available. Add schedules in Sanity Studio.</div>
          )}

          {!loading && !error && schedules && schedules.map((schedule: ScheduleDoc, idx: number) => (
            <ClassSchedule key={idx} className={schedule.className} schedule={schedule.days} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default SchedulePage
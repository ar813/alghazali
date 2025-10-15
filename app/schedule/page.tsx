"use client"

import React, { useEffect, useState } from "react"
import { client } from "@/sanity/lib/client"
import { getAllSchedulesQuery } from "@/sanity/lib/queries"
import { GraduationCap, CalendarDays, Clock } from "lucide-react"
import NavBar from "@/components/NavBar/NavBar"
import Footer from "@/components/Footer/Footer"

type Period = { subject: string; time: string }
type Day = { day: string; periods: Period[] }
type ScheduleDoc = { className: string; days: Day[] }

async function fetchSchedules(): Promise<ScheduleDoc[]> {
  return await client.fetch(getAllSchedulesQuery)
}

const ClassSchedule = ({ className, schedule }: { className: string; schedule: Day[] }) => (
  <div className="mb-16 border border-white/40 bg-white/30 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-3xl px-6 py-4 flex items-center gap-3">
      <GraduationCap className="w-6 h-6 text-white/90" />
      <h2 className="text-xl sm:text-2xl font-semibold tracking-wide">
        {className !== "SSCI" && className !== "SSCII" ? "Class " : ""}
        {className}
      </h2>
    </div>

    {/* Schedule Days */}
    <div className="p-6 space-y-8">
      {schedule.map((day, i) => (
        <div
          key={i}
          className="border border-blue-100/60 rounded-2xl p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">{day.day}</h3>
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {day.periods.map((p, j) => (
              <div
                key={j}
                className="rounded-xl bg-white/80 border border-gray-200 p-4 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
              >
                <p className="font-semibold text-gray-800 text-sm sm:text-base">{p.subject}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{p.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

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
        const sorted = (res || []).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }))
        setSchedules(sorted)
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || "Failed to load schedules")
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <NavBar />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-100/40 to-indigo-200/30 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">
             📚 Class Schedules
            </h1>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Explore each class’s full weekly schedule — organized by subjects, and timings.
              Stay prepared and never miss your favorite subject!
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-32">
              <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center bg-red-100 border border-red-300 text-red-700 font-medium py-6 rounded-2xl max-w-xl mx-auto">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && schedules?.length === 0 && (
            <div className="text-center text-gray-600 py-20">
              No schedules available. Add new schedules in Sanity Studio.
            </div>
          )}

          {/* Schedule Cards */}
          {!loading &&
            !error &&
            schedules &&
            schedules.map((s, idx) => (
              <ClassSchedule key={idx} className={s.className} schedule={s.days} />
            ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SchedulePage

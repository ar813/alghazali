import { Download, Users, PieChart, BarChart2 } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'

type StudentType = {
  _id: string
  fullName: string
  gender?: string
  admissionFor?: string
}

const AdminReports = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      onLoadingChange?.(true)
      const data: StudentType[] = await client.fetch(getAllStudentsQuery)
      setStudents(data)
      setLoading(false)
      onLoadingChange?.(false)
    }
    fetchStudents()
  }, [onLoadingChange])

  const totals = useMemo(() => {
    const total = students.length
    const male = students.filter(s => s.gender === 'male').length
    const female = students.filter(s => s.gender === 'female').length
    return { total, male, female }
  }, [students])

  const classWise = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of students) {
      const key = s.admissionFor || '—'
      map.set(key, (map.get(key) || 0) + 1)
    }
    // sort by class label natural-ish
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [students])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between animate-pulse">
                <div>
                  <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-200" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{totals.total.toLocaleString()}</p>
              </div>
              <Users className="text-blue-600" />
            </div>
            <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Male</p>
                <p className="text-2xl font-bold">{totals.male.toLocaleString()}</p>
              </div>
              <PieChart className="text-green-600" />
            </div>
            <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Female</p>
                <p className="text-2xl font-bold">{totals.female.toLocaleString()}</p>
              </div>
              <PieChart className="text-pink-600" />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class-wise distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={18} /> Class-wise Distribution</h3>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : classWise.length === 0 ? (
            <div className="text-sm text-gray-500">No data</div>
          ) : (
            <div className="divide-y">
              {classWise.map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Class {cls}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export block (placeholder) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Export Reports</h3>
          <div className="space-y-3">
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm">
              <Download size={16} />
              <span>Export Students CSV</span>
            </button>
            <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm">
              <Download size={16} />
              <span>Export Class Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminReports
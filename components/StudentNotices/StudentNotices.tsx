import { Megaphone } from 'lucide-react'
import React, { useEffect, useState } from 'react'

type Notice = {
  _id: string
  title: string
  content: string
  targetType: 'all' | 'class' | 'student'
  className?: string
  student?: { _id: string; fullName: string }
  createdAt?: string
  _createdAt?: string
}

const StudentNotices = ({ studentId, className }: { studentId?: string; className?: string }) => {
  const [items, setItems] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (studentId) params.set('studentId', studentId)
      if (className) params.set('className', className)
      params.set('limit', '50')
      const res = await fetch(`/api/notices?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setItems(json.data as Notice[])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [studentId, className, load])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
          <Megaphone size={20} className="text-orange-500" />
          Latest Notices
        </h3>
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">No notices yet.</div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {items.map((n) => (
              <div key={n._id} className={`border-l-4 pl-3 sm:pl-6 p-3 sm:p-6 rounded-r-lg sm:rounded-r-2xl shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-blue-500 bg-blue-50`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between mb-2 sm:mb-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500`}></div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">{n.title}</h4>
                    <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-white text-blue-700 border`}>{n.targetType.toUpperCase()}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 bg-white/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full self-start sm:self-auto">
                    {new Date(n.createdAt || n._createdAt || '').toLocaleString()}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentNotices
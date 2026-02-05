import { Megaphone, Bell, RefreshCw } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from "sonner"

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

  const load = React.useCallback(async (isManual = false) => {
    setLoading(true)
    if (isManual) toast.loading("Checking for updates...", { id: "refresh-notices" });
    try {
      const params = new URLSearchParams()
      if (studentId) params.set('studentId', studentId)
      if (className) params.set('className', className)
      params.set('limit', '50')
      const res = await fetch(`/api/notices?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) {
        setItems(json.data as Notice[])
        if (isManual) toast.success("Notices updated", { id: "refresh-notices" });
      } else {
        if (isManual) toast.error("Failed to update notices", { id: "refresh-notices" });
      }
    } catch {
      if (isManual) toast.error("Network error updating notices", { id: "refresh-notices" });
    } finally { setLoading(false) }
  }, [studentId, className])

  useEffect(() => { load() }, [load])

  // Badge color based on target type
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'all':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'
      case 'class':
        return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800'
      case 'student':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800'
      default:
        return 'bg-neutral-50 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 border-neutral-100 dark:border-neutral-800'
    }
  }

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'all': return 'border-l-blue-500 dark:border-l-blue-400'
      case 'class': return 'border-l-purple-500 dark:border-l-purple-400'
      case 'student': return 'border-l-orange-500 dark:border-l-orange-400'
      default: return 'border-l-neutral-500'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Vercel Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            <Megaphone size={18} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Latest Notices</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Important announcements</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="px-3.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
                <div className="h-5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-4/5 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Bell size={28} className="text-neutral-400" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">No notices yet.</p>
        </div>
      ) : (
        /* Notices List */
        <div className="space-y-4">
          {items.map((n) => (
            <div
              key={n._id}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-l-4 ${getAccentColor(n.targetType)} p-5 sm:p-6 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300`}
            >
              {/* Notice Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">{n.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(n.targetType)}`}>
                    {n.targetType}
                  </span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full font-medium self-start sm:self-auto">
                  {new Date(n.createdAt || n._createdAt || '').toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                </span>
              </div>

              {/* Notice Content */}
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentNotices
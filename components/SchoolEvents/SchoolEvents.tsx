import { Calendar } from 'lucide-react'
import React, { useEffect, useState } from 'react'

type EventItem = {
  _id: string
  title: string
  content: string
  eventDate?: string
  eventType?: string
}

const SchoolEvents = () => {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notices?events=1&limit=8', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setEvents(json.data as EventItem[])
    } catch {
      // swallow
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const formatBadgeDate = (iso?: string) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
    } catch { return '—' }
  }

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            Stay updated with our latest events and activities.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-4 sm:p-6 animate-pulse">
                <div className="h-5 w-20 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-500">No upcoming events.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="bg-indigo-100 text-indigo-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    {formatBadgeDate(event.eventDate)}
                  </div>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1 sm:mb-2">{event.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{event.eventType || 'General'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default SchoolEvents
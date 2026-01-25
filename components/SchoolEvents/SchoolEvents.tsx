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
    <section id="events" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">Upcoming Events</h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Stay updated with our latest events and activities.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-6 animate-pulse">
                <div className="h-5 w-20 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground">No upcoming events.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-card border border-border rounded-xl hover:border-primary/50 transition-all duration-300 p-4 sm:p-6 group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="bg-primary/5 text-primary border border-border px-3 py-1 rounded-md text-xs sm:text-sm font-medium">
                    {formatBadgeDate(event.eventDate)}
                  </div>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-bold text-base mb-1 text-foreground tracking-tight">{event.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">{event.eventType || 'General'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default SchoolEvents
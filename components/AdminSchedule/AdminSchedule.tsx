import React, { useEffect, useState } from 'react'
import { Calendar, Plus, Save, Sparkles, Trash2 } from 'lucide-react'

// Types
 type ScheduleDay = { day: string; periods: { subject: string; time: string }[] }
 type ScheduleDoc = { _id: string; className: string; days: ScheduleDay[] }

const AdminSchedule = () => {
  const [schedules, setSchedules] = useState<ScheduleDoc[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState<boolean>(false)

  // Form state
  const classOptions = ['1','2','3','4','5','6','7','8','SSCI','SSCII']
  const dayOptions = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']
  const subjectOptions = ['English','Urdu','Math','Science','Islamiat','Computer','History','Art']
  const timeOptions = ['08:00 - 08:35','08:35 - 09:10','09:10 - 09:45','09:45 - 10:20','10:20 - 10:55','10:55 - 11:30','11:30 - 12:05','12:05 - 12:40','12:40 - 13:15','13:15 - 13:50']

  const [formClass, setFormClass] = useState<string>('')
  const [formDay, setFormDay] = useState<string>('')
  const [formPeriods, setFormPeriods] = useState<{ subject: string; time: string }[]>([{ subject: '', time: '' }])
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true)
      const res = await fetch('/api/schedule', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setSchedules(json.data as ScheduleDoc[])
    } catch {}
    finally { setLoadingSchedules(false) }
  }

  const addPeriodRow = () => setFormPeriods(prev => [...prev, { subject: '', time: '' }])
  const removePeriodRow = (idx: number) => setFormPeriods(prev => prev.filter((_, i) => i !== idx))
  const updatePeriod = (idx: number, key: 'subject'|'time', value: string) =>
    setFormPeriods(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))

  const submitSchedule = async () => {
    if (!formClass || !formDay || formPeriods.some(p => !p.subject || !p.time)) {
      alert('Please select class, day and fill all periods')
      return
    }
    try {
      setFormSubmitting(true)
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className: formClass, day: formDay, periods: formPeriods })
      })
      const json = await res.json()
      if (json?.ok) {
        setFormPeriods([{ subject: '', time: '' }])
        await loadSchedules()
        alert('Schedule saved successfully')
      } else {
        alert(json?.error || 'Failed to save schedule')
      }
    } catch {
      alert('Failed to save schedule')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Calendar size={18}/> This Week Schedule</h3>
          <button onClick={loadSchedules} className="text-sm inline-flex items-center gap-1 px-3 py-1 rounded-lg border bg-white hover:bg-gray-50"><Sparkles size={14}/> Refresh</button>
        </div>
        {loadingSchedules ? (
          <div className="text-sm text-gray-500">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="text-sm text-gray-500">No schedules found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map(sc => (
              <div key={sc._id} className="rounded-xl border p-3">
                <div className="font-semibold mb-2">Class {sc.className}</div>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {sc.days?.slice(0, 4).map(day => (
                    <div key={day.day}>
                      <div className="text-xs text-gray-500 mb-1">{day.day}</div>
                      <div className="space-y-1">
                        {day.periods?.slice(0, 4).map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{p.subject}</span>
                            <span className="text-gray-500">{p.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Schedule */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Calendar size={18}/> Manage Schedule</h3>
          <button onClick={submitSchedule} disabled={formSubmitting} className="text-sm inline-flex items-center gap-1 px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60"><Save size={14}/> {formSubmitting ? 'Saving...' : 'Save Schedule'}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Class</label>
            <select value={formClass} onChange={e => setFormClass(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
              <option value="">Select Class</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Day</label>
            <select value={formDay} onChange={e => setFormDay(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
              <option value="">Select Day</option>
              {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addPeriodRow} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus size={16}/> Add Period</button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {formPeriods.map((p, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-sm text-gray-600">Subject</label>
                <select value={p.subject} onChange={e => updatePeriod(idx, 'subject', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">Select Subject</option>
                  {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Time</label>
                <select value={p.time} onChange={e => updatePeriod(idx, 'time', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">Select Time</option>
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => removePeriodRow(idx)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm text-red-600 border-red-200"><Trash2 size={16}/> Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-3">Tip: Selecting an existing Class + Day will update periods for that day. Otherwise a new day will be added for the class.</div>
      </div>
    </div>
  )
}

export default AdminSchedule

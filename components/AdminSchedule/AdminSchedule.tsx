import React, { useEffect, useState } from 'react'
import { Calendar, Plus, Save, Sparkles, Trash2 } from 'lucide-react'

// Types
 type ScheduleDay = { day: string; periods: { subject: string; time: string }[] }
 type ScheduleDoc = { _id: string; className: string; days: ScheduleDay[] }

const AdminSchedule = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
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
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editClass, setEditClass] = useState<string>('')
  const [editDay, setEditDay] = useState<string>('')
  const [editPeriods, setEditPeriods] = useState<{ subject: string; time: string }[]>([{ subject: '', time: '' }])
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false)
  // Toasts
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    window.setTimeout(() => setToast(null), 2000)
  }
  // Delete confirm state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; className: string; day: string } | null>(null)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true)
      onLoadingChange?.(true)
      const res = await fetch('/api/schedule', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setSchedules(json.data as ScheduleDoc[])
    } catch {
      showToast('Failed to load schedules', 'error')
    }
    finally { setLoadingSchedules(false); onLoadingChange?.(false) }
  }

  // Helpers for Edit modal
  const openEditModalForClass = (className: string) => {
    setEditClass(className)
    setEditDay('')
    setEditPeriods([{ subject: '', time: '' }])
    setShowEditModal(true)
  }
  const openEditModalForDay = (className: string, dayName: string, periods?: { subject: string; time: string }[]) => {
    setEditClass(className)
    setEditDay(dayName)
    setEditPeriods(periods?.length ? periods : [{ subject: '', time: '' }])
    setShowEditModal(true)
  }
  const addEditPeriodRow = () => setEditPeriods(prev => [...prev, { subject: '', time: '' }])
  const removeEditPeriodRow = (idx: number) => setEditPeriods(prev => prev.filter((_, i) => i !== idx))
  const updateEditPeriod = (idx: number, key: 'subject' | 'time', value: string) =>
    setEditPeriods(prev => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)))
  const submitEditSchedule = async () => {
    if (!editClass || !editDay || editPeriods.some(p => !p.subject || !p.time)) {
      showToast('Please select class, day and fill all periods', 'error')
      return
    }
    try {
      setEditSubmitting(true)
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className: editClass, day: editDay, periods: editPeriods })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to save schedule')
      setShowEditModal(false)
      await loadSchedules()
      showToast('Schedule updated', 'success')
    } catch {
      showToast('Failed to save schedule', 'error')
    } finally {
      setEditSubmitting(false)
    }
  }

  const addPeriodRow = () => setFormPeriods(prev => [...prev, { subject: '', time: '' }])
  const removePeriodRow = (idx: number) => setFormPeriods(prev => prev.filter((_, i) => i !== idx))
  const updatePeriod = (idx: number, key: 'subject'|'time', value: string) =>
    setFormPeriods(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))

  const submitSchedule = async () => {
    if (!formClass || !formDay || formPeriods.some(p => !p.subject || !p.time)) {
      showToast('Please select class, day and fill all periods', 'error')
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
      if (!json?.ok) throw new Error(json?.error || 'Failed to save schedule')
      setFormClass('')
      setFormDay('')
      setFormPeriods([{ subject: '', time: '' }])
      await loadSchedules()
      showToast('Schedule saved', 'success')
    } catch {
      showToast('Failed to save schedule', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete API call
  const deleteScheduleDay = async (className: string, day: string) => {
    try {
      // Many runtimes don't accept a body on DELETE; prefer query params
      const url = `/api/schedule?className=${encodeURIComponent(className)}&day=${encodeURIComponent(day)}`
      let res = await fetch(url, { method: 'DELETE' })
      // Fallback: if server doesn't support DELETE, try POST with action
      if (!res.ok) {
        res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', className, day })
        })
      }
      const json = await res.json().catch(() => ({ ok: res.ok }))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Failed to delete')
      await loadSchedules()
      showToast('Deleted successfully', 'success')
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Manage Schedule (first) */}
      <div id="manage-schedule" className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
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

      {/* Overview (second) */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600"/> 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">This Week Schedule</span>
          </h3>
          <button onClick={loadSchedules} className="text-sm inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-200">
            <Sparkles size={16} className="text-blue-600"/> 
            <span className="text-blue-700 font-medium">Refresh</span>
          </button>
        </div>
        
        {loadingSchedules ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-100 p-5 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4" />
                <div className="space-y-3">
                  {[...Array(5)].map((__, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Calendar size={32} className="text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No Schedules Found</h4>
            <p className="text-gray-500 mb-6">Create your first class schedule using the form above.</p>
            <button 
              onClick={() => document.getElementById('manage-schedule')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={16} />
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map(sc => (
              <div key={sc._id} className="group rounded-2xl border-2 border-gray-100 hover:border-blue-200 p-5 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-purple-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {sc.className}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">Class {sc.className}</h4>
                      <p className="text-xs text-gray-500">{sc.days?.length || 0} days scheduled</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModalForClass(sc.className)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                    title="Add new day"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                  {sc.days?.slice(0, 7).map(day => (
                    <div key={day.day} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                          <span className="font-semibold text-gray-800 text-sm">{day.day}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {day.periods?.length || 0} periods
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg transition-all duration-200"
                            onClick={() => openEditModalForDay(sc.className, day.day, day.periods)}
                            title="Edit day"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                            title="Delete day"
                            onClick={() => setConfirmDelete({ open: true, className: sc.className, day: day.day })}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {day.periods?.slice(0, 6).map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-800 font-medium text-sm">{p.subject}</span>
                            </div>
                            <span className="text-gray-600 text-xs font-mono bg-white px-2 py-1 rounded border">{p.time}</span>
                          </div>
                        ))}
                        {(day.periods?.length || 0) > 6 && (
                          <div className="text-center py-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              +{(day.periods?.length || 0) - 6} more periods
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(sc.days?.length || 0) === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <Calendar size={20} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm mb-3">No days scheduled yet</p>
                      <button
                        onClick={() => openEditModalForClass(sc.className)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Add first day
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Edit Schedule">
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-6 w-full sm:max-w-xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-xl font-semibold">Edit Schedule</h3>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setShowEditModal(false)}>Close</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Class</label>
                <select value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Day</label>
                <select value={editDay} onChange={e => setEditDay(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                  <option value="">Select Day</option>
                  {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={addEditPeriodRow} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus size={16}/> Add Period</button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {editPeriods.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm text-gray-600">Subject</label>
                    <select value={p.subject} onChange={e => updateEditPeriod(idx, 'subject', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                      <option value="">Select Subject</option>
                      {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Time</label>
                    <select value={p.time} onChange={e => updateEditPeriod(idx, 'time', e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                      <option value="">Select Time</option>
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => removeEditPeriodRow(idx)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm text-red-600 border-red-200"><Trash2 size={16}/> Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded w-full sm:w-auto">Cancel</button>
              <button onClick={submitEditSchedule} disabled={editSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto">{editSubmitting ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete?.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Delete Day Confirm">
          <div className="bg-white sm:rounded-xl rounded-none p-6 w-full sm:max-w-sm shadow-2xl border">
            <h4 className="text-lg font-semibold mb-2">Delete Day</h4>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete schedule for <span className="font-semibold">Class {confirmDelete.className} • {confirmDelete.day}</span>?</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setConfirmDelete(null)}>No</button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => { const { className, day } = confirmDelete; setConfirmDelete(null); deleteScheduleDay(className, day) }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast?.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AdminSchedule

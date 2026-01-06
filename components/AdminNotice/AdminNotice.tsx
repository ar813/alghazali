"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Megaphone, Save, Loader2, Edit2, Trash2, RefreshCw, X } from 'lucide-react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import type { Student } from '@/types/student'

const AdminNotice = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (m: string, t: 'success'|'error' = 'success') => { setToast({ show: true, message: m, type: t }); window.setTimeout(() => setToast(null), 2200) }

  useEffect(() => {
    const load = async () => {
      setLoading(true); onLoadingChange?.(true)
      try {
        const s: Student[] = await client.fetch(getAllStudentsQuery)
        setStudents(s)
      } finally {
        setLoading(false); onLoadingChange?.(false)
      }
    }
    load()
  }, [onLoadingChange])

  const classOptions = useMemo(() => Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort(), [students])

  type TargetType = 'all' | 'class' | 'student'
  const [form, setForm] = useState<{ title: string; content: string; targetType: TargetType; className?: string; studentId?: string; isEvent: boolean; eventDate?: string; eventType?: string; isHeadline?: boolean }>({
    title: '', content: '', targetType: 'all', className: '', studentId: '', isEvent: false, eventDate: '', eventType: '', isHeadline: false,
  })
  const [studentQuickFilter, setStudentQuickFilter] = useState('')

  const submit = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error')
    if (!form.content.trim()) return showToast('Content is required', 'error')
    if (form.targetType === 'class' && !form.className) return showToast('Class is required for class target', 'error')
    if (form.targetType === 'student' && !form.studentId) return showToast('Student is required for student target', 'error')
    // email sending removed from UI
    setSaving(true)
    try {
      const res = await fetch('/api/notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: form.title,
        content: form.content,
        targetType: form.targetType,
        className: form.className || undefined,
        studentId: form.studentId || undefined,
        isEvent: form.isEvent,
        eventDate: form.isEvent && form.eventDate ? new Date(form.eventDate).toISOString() : undefined,
        eventType: form.isEvent ? (form.eventType || 'General') : undefined,
        isHeadline: !!form.isHeadline,
      }) })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to create notice')
      showToast('Notice created', 'success')
      setForm({ title: '', content: '', targetType: 'all', className: '', studentId: '', isEvent: false, eventDate: '', eventType: '', isHeadline: false })
    } catch (e: any) {
      showToast(e?.message || 'Failed to create notice', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18}/> Create Notice</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g. Midterm Exams" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Write the notice content..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target</label>
            <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value as TargetType })} className="w-full border rounded px-3 py-2">
              <option value="all">Whole School</option>
              <option value="class">Class</option>
              <option value="student">Particular Student</option>
            </select>
          </div>
          {form.targetType === 'class' && (
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select Class</option>
                {classOptions.map(c => <option key={c} value={c || ''}>{c}</option>)}
              </select>
            </div>
          )}
          {form.targetType === 'student' && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Student</label>
              <input
                value={studentQuickFilter}
                onChange={e => setStudentQuickFilter(e.target.value)}
                placeholder="Filter by Roll or GR"
                className="w-full border rounded px-3 py-2 mb-2 text-sm"
              />
              <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select Student</option>
                {students
                  .filter(s => {
                    const q = studentQuickFilter.trim().toLowerCase();
                    if (!q) return true;
                    const roll = String((s as any).rollNumber || '').toLowerCase();
                    const gr = String(s.grNumber || '').toLowerCase();
                    return roll.includes(q) || gr.includes(q);
                  })
                  .slice()
                  .sort((a:any,b:any)=>{
                    const ra = parseInt(String(a.rollNumber||'').replace(/[^0-9]/g,''),10)
                    const rb = parseInt(String(b.rollNumber||'').replace(/[^0-9]/g,''),10)
                    const na = isNaN(ra) ? Infinity : ra
                    const nb = isNaN(rb) ? Infinity : rb
                    return na - nb
                  })
                  .map(s => <option key={s._id} value={s._id}>{(s as any).rollNumber} - {s.fullName} - GR {s.grNumber}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2 flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isEvent} onChange={e => setForm({ ...form, isEvent: e.target.checked })} /> Make this an event</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isHeadline} onChange={e => setForm({ ...form, isHeadline: e.target.checked })} /> Make it a Headline</label>
            {form.isEvent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Date</label>
                  <input type="datetime-local" value={form.eventDate || ''} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Event Type</label>
                  <input value={form.eventType || ''} onChange={e => setForm({ ...form, eventType: e.target.value })} placeholder="e.g. Academic, Sports" className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Create Notice
          </button>
        </div>
      </div>

      <NoticesList onLoadingChange={onLoadingChange} students={students} classOptions={classOptions} />

      {toast?.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}
    </div>
  )
}

const NoticesList = ({ onLoadingChange, students, classOptions }: { onLoadingChange?: (loading: boolean) => void; students: Student[]; classOptions: string[] }) => {
  const [items, setItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (m: string, t: 'success'|'error' = 'success') => { setToast({ show: true, message: m, type: t }); window.setTimeout(() => setToast(null), 2200) }
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [deleteAllInput, setDeleteAllInput] = useState('')

  const load = useCallback(async () => {
    onLoadingChange?.(true)
    try {
      const res = await fetch('/api/notices?limit=500', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setItems(json.data)
    } finally { onLoadingChange?.(false) }
  }, [onLoadingChange])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18}/> All Notices</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => { setDeleteAllInput(''); setShowDeleteAllConfirm(true) }} className="px-3 py-1.5 border rounded text-sm text-red-600 inline-flex items-center gap-2"><Trash2 size={14}/> Delete All</button>
          <button onClick={load} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">No notices yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <div key={n._id} className="p-3 rounded border bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {n.title}
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${n.targetType==='all' ? 'bg-blue-50 text-blue-700 border-blue-200' : n.targetType==='class' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {n.targetType.toUpperCase()}
                    </span>
                    {n.isEvent && (
                      <span className="px-2 py-0.5 rounded-full text-xs border bg-amber-50 text-amber-700 border-amber-200">EVENT</span>
                    )}
                    {n.isHeadline && (
                      <span className="px-2 py-0.5 rounded-full text-xs border bg-rose-50 text-rose-700 border-rose-200">HEADLINE</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(n.createdAt || n._createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(n)} className="px-2 py-1 text-xs border rounded inline-flex items-center gap-1"><Edit2 size={14}/> Edit</button>
                  <button onClick={async () => { setWorkingId(n._id); try { await fetch(`/api/notices?id=${n._id}`, { method: 'DELETE' }); setItems(items.filter(i => i._id !== n._id)); showToast('Notice deleted.', 'success') } finally { setWorkingId(null) } }} disabled={workingId===n._id} className="px-2 py-1 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14}/>{workingId===n._id?'...':'Delete'}</button>
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</div>
              <div className="text-xs text-gray-500 mt-1">Target: {n.targetType}{n.className ? ` (${n.className})` : ''}{n.student?.fullName ? ` (${n.student.fullName})` : ''}</div>
              {n.isEvent && (
                <div className="text-xs text-amber-700 mt-1">Event: {n.eventType || 'General'} — {n.eventDate ? new Date(n.eventDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true }) : 'No date'}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          notice={editing}
          students={students}
          classOptions={classOptions}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i))
            setEditing(null)
          }}
        />
      )}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4">
            <h4 className="font-semibold mb-2">Delete All Notices</h4>
            <p className="text-sm text-gray-600">Type <span className="font-mono font-semibold">DELETE</span> to confirm. This action cannot be undone.</p>
            <input value={deleteAllInput} onChange={e=>setDeleteAllInput(e.target.value)} className="w-full border rounded px-3 py-2 mt-3" placeholder="Type DELETE" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowDeleteAllConfirm(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button disabled={deleteAllInput !== 'DELETE'} onClick={async ()=>{ try { await fetch('/api/notices?all=true', { method: 'DELETE' }); setItems([]); showToast('All notices deleted','success') } finally { setShowDeleteAllConfirm(false); setDeleteAllInput('') } }} className={`px-4 py-2 rounded text-white ${deleteAllInput==='DELETE' ? 'bg-red-600' : 'bg-red-300 cursor-not-allowed'}`}>Delete All</button>
            </div>
          </div>
        </div>
      )}
      {toast?.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}
    </div>
  )
}

const EditModal = ({ notice, onClose, onSaved, students, classOptions }: { notice: any; onClose: () => void; onSaved: (n: any) => void; students: Student[]; classOptions: string[] }) => {
  const [title, setTitle] = useState(notice.title as string)
  const [content, setContent] = useState(notice.content as string)
  const [targetType, setTargetType] = useState<'all'|'class'|'student'>(notice.targetType)
  const [className, setClassName] = useState<string>(notice.className || '')
  const [studentId, setStudentId] = useState<string>(notice.student?._id || '')
  const [isEvent, setIsEvent] = useState<boolean>(!!notice.isEvent)
  const [isHeadline, setIsHeadline] = useState<boolean>(!!notice.isHeadline)
  const [eventDate, setEventDate] = useState<string>(notice.eventDate ? new Date(notice.eventDate).toISOString().slice(0,16) : '')
  const [eventType, setEventType] = useState<string>(notice.eventType || '')
  const [saving, setSaving] = useState(false)
  const [studentQuickFilter, setStudentQuickFilter] = useState('')

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/notices', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notice._id, title, content, targetType, className: className || undefined, studentId: studentId || undefined, isEvent, eventDate: isEvent && eventDate ? new Date(eventDate).toISOString() : undefined, eventType: isEvent ? (eventType || 'General') : undefined, isHeadline }) })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to update')
      onSaved({ ...notice, title, content, targetType, className, student: studentId ? { _id: studentId, fullName: notice.student?.fullName || 'Student' } : null, isEvent, eventDate: isEvent ? (eventDate ? new Date(eventDate).toISOString() : null) : null, eventType: isEvent ? (eventType || 'General') : null, isHeadline })
    } catch (_e) {
      // no-op basic error display for now
      alert('Failed to update notice')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Edit Notice</h4>
          <button onClick={onClose} className="p-1 text-gray-500"><X size={16}/></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Content</label>
            <textarea value={content} onChange={e=>setContent(e.target.value)} rows={4} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Target</label>
              <select value={targetType} onChange={e=>setTargetType(e.target.value as any)} className="w-full border rounded px-3 py-2">
                <option value="all">Whole School</option>
                <option value="class">Class</option>
                <option value="student">Particular Student</option>
              </select>
            </div>
            {targetType==='class' && (
              <div>
                <label className="block text-sm mb-1">Class</label>
                <select value={className} onChange={e=>setClassName(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {targetType==='student' && (
              <div className="col-span-2">
                <label className="block text-sm mb-1">Student</label>
                <input
                  value={studentQuickFilter}
                  onChange={e => setStudentQuickFilter(e.target.value)}
                  placeholder="Filter by Roll or GR"
                  className="w-full border rounded px-3 py-2 mb-2 text-sm"
                />
                <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="w-full border rounded px-3 py-2">
                  <option value="">Select Student</option>
                  {students
                    .filter(s => {
                      const q = studentQuickFilter.trim().toLowerCase();
                      if (!q) return true;
                      const roll = String((s as any).rollNumber || '').toLowerCase();
                      const gr = String(s.grNumber || '').toLowerCase();
                      return roll.includes(q) || gr.includes(q);
                    })
                    .slice()
                    .sort((a:any,b:any)=>{
                      const ra = parseInt(String(a.rollNumber||'').replace(/[^0-9]/g,''),10)
                      const rb = parseInt(String(b.rollNumber||'').replace(/[^0-9]/g,''),10)
                      const na = isNaN(ra) ? Infinity : ra
                      const nb = isNaN(rb) ? Infinity : rb
                      return na - nb
                    })
                    .map(s => <option key={s._id} value={s._id}>{s.fullName} — {s.grNumber} — Roll {(s as any).rollNumber}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="space-y-2 mt-2">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={isEvent} onChange={e=>setIsEvent(e.target.checked)} /> Make this an event</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={isHeadline} onChange={e=>setIsHeadline(e.target.checked)} /> Make it a Headline</label>
            {isEvent && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Event Date</label>
                  <input type="datetime-local" value={eventDate} onChange={e=>setEventDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Event Type</label>
                  <input value={eventType} onChange={e=>setEventType(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. Academic, Sports" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16}/> : <Edit2 size={16}/>} Save</button>
        </div>
      </div>
    </div>
  )
}

export default AdminNotice


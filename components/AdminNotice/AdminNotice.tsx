"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Megaphone, Send, Save, Users, User, School, Loader2 } from 'lucide-react'
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
  const [form, setForm] = useState<{ title: string; content: string; targetType: TargetType; className?: string; studentId?: string; sendEmail: boolean }>({
    title: '', content: '', targetType: 'all', className: '', studentId: '', sendEmail: false,
  })

  const submit = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error')
    if (!form.content.trim()) return showToast('Content is required', 'error')
    if (form.targetType === 'class' && !form.className) return showToast('Class is required for class target', 'error')
    if (form.targetType === 'student' && !form.studentId) return showToast('Student is required for student target', 'error')
    setSaving(true)
    try {
      const res = await fetch('/api/notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: form.title, content: form.content, targetType: form.targetType, className: form.className || undefined, studentId: form.studentId || undefined, sendEmail: form.sendEmail,
      }) })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to create notice')
      showToast('Notice created', 'success')
      setForm({ title: '', content: '', targetType: 'all', className: '', studentId: '', sendEmail: false })
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
              <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select Student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.fullName} — {s.grNumber} — Roll {s.rollNumber}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sendEmail} onChange={e => setForm({ ...form, sendEmail: e.target.checked })} /> Also send via email</label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Create Notice
          </button>
        </div>
      </div>

      <NoticesList />

      {toast?.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}
    </div>
  )
}

const NoticesList = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notices?limit=50', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setItems(json.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18}/> Recent Notices</h3>
        <button onClick={load} className="px-3 py-1.5 border rounded text-sm">Refresh</button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No notices yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <div key={n._id} className="p-3 rounded border bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-800">{n.title}</div>
                <span className="text-xs text-gray-500">{new Date(n.createdAt || n._createdAt).toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</div>
              <div className="text-xs text-gray-500 mt-1">Target: {n.targetType}{n.className ? ` (${n.className})` : ''}{n.student?.fullName ? ` (${n.student.fullName})` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminNotice

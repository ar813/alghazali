"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Loader2, Trash2, Edit2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'

type Quiz = {
  _id: string
  title: string
  subject: string
  examKey?: string
  targetType: 'all' | 'class' | 'student'
  className?: string
  student?: { _id: string; fullName: string }
  questions: { question: string; options: string[]; correctIndex: number; difficulty?: 'easy'|'medium'|'hard' }[]
  resultsAnnounced?: boolean
  durationMinutes?: number
  questionLimit?: number
  createdAt?: string
  _createdAt?: string
}

type StudentLite = { _id: string; fullName: string; admissionFor?: string; grNumber?: string }

const AdminQuiz = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<StudentLite[]>([])
  const [items, setItems] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDraft, setEditDraft] = useState<any>(null)
  const [studentQuickFilter, setStudentQuickFilter] = useState('')
  const genId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2,8)}`)

  const classOptions = useMemo(() => Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort() as string[], [students])

  useEffect(() => {
    const load = async () => {
      setLoading(true); onLoadingChange?.(true)
      try {
        // Students (for targeting)
        const s = await client.fetch(getAllStudentsQuery)
        setStudents(s as any as StudentLite[])
        // Quizzes
        const res = await fetch('/api/quizzes?limit=100', { cache: 'no-store' })
        const json = await res.json()
        if (json?.ok) setItems(json.data as Quiz[])
      } finally { setLoading(false); onLoadingChange?.(false) }
    }
    load()
  }, [onLoadingChange])

  type TargetType = 'all'|'class'|'student'
  const [form, setForm] = useState<{ title: string; subject: string; examKey: string; targetType: TargetType; className?: string; studentId?: string; durationMinutes?: number | '' ; questionLimit?: number | '' ; questions: ({ _key: string; question: string; options: string[]; correctIndex: number; difficulty?: 'easy'|'medium'|'hard' })[] }>({
    title: '', subject: '', examKey: '', targetType: 'all', className: '', studentId: '', durationMinutes: '', questionLimit: '', questions: [ { _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' } ]
  })

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, { _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' }] }))
  const updateQuestion = (idx: number, patch: Partial<{ question: string; options: string[]; correctIndex: number; difficulty?: 'easy'|'medium'|'hard' }>) => {
    setForm(f => ({ ...f, questions: f.questions.map((q, i) => i===idx ? { ...q, ...patch } : q) }))
  }
  const removeQuestion = (idx: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }))

  const submit = async () => {
    if (!form.title.trim()) return alert('Title is required')
    if (!form.subject.trim()) return alert('Subject is required')
    if (!form.examKey.trim()) return alert('Exam Key is required')
    if (form.targetType === 'class' && !form.className) return alert('Class is required')
    if (form.targetType === 'student' && !form.studentId) return alert('Student is required')
    if (typeof form.questionLimit !== 'number' || !(form.questionLimit >= 1 && form.questionLimit <= 200)) return alert('Total Questions is required (1-200)')
    const valid = form.questions.every(q => q.question.trim() && q.options.length === 4 && q.options.every(o => o.trim() !== '') && q.correctIndex >=0 && q.correctIndex < 4)
    if (!valid) return alert('Please fill all questions with 4 options and a correct index')

    setSaving(true)
    try {
      const res = await fetch('/api/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: form.title, subject: form.subject, examKey: form.examKey, targetType: form.targetType, className: form.className || undefined, studentId: form.studentId || undefined, questions: form.questions,
        durationMinutes: typeof form.durationMinutes === 'number' ? form.durationMinutes : undefined,
        questionLimit: form.questionLimit,
      }) })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to create quiz')
      // reload list
      const list = await fetch('/api/quizzes?limit=100', { cache: 'no-store' })
      const listJson = await list.json()
      if (listJson?.ok) setItems(listJson.data)
      // reset form
      setForm({ title: '', subject: '', examKey: '', targetType: 'all', className: '', studentId: '', durationMinutes: '', questionLimit: '', questions: [ { _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' } ] })
    } catch (e: any) {
      alert(e?.message || 'Failed to create quiz')
    } finally { setSaving(false) }
  }

  const deleteQuiz = async (id: string) => {
    if (!confirm('Delete this quiz?')) return
    setWorkingId(id)
    try {
      await fetch(`/api/quizzes?id=${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i._id !== id))
    } finally { setWorkingId(null) }
  }

  // editing handled via modal

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Plus size={18}/> Create Quiz</h3>
        </div>
    {showEditModal && editDraft && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center sm:items-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-none sm:rounded-xl shadow-xl w-full max-w-2xl p-4 sm:p-5 max-h-[95vh] sm:max-h-[85vh] overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Edit Quiz</h4>
            <button onClick={()=>setShowEditModal(false)} className="p-1 text-gray-500">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input value={editDraft.title} onChange={e=>setEditDraft((d:any)=>({ ...d, title: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <input value={editDraft.subject} onChange={e=>setEditDraft((d:any)=>({ ...d, subject: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Exam Key (required)</label>
              <input value={(editDraft as any).examKey || ''} onChange={e=>setEditDraft((d:any)=>({ ...d, examKey: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Enter Exam Key" />
            </div>
            <div>
              <label className="block text-sm mb-1">Duration (minutes)</label>
              <input type="number" min={1} max={600} value={editDraft.durationMinutes || ''} onChange={e=>setEditDraft((d:any)=>({ ...d, durationMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Total Questions (required)</label>
              <input type="number" min={1} max={200} value={editDraft.questionLimit || ''} onChange={e=>setEditDraft((d:any)=>({ ...d, questionLimit: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Target</label>
              <select value={editDraft.targetType} onChange={e=>setEditDraft((d:any)=>({ ...d, targetType: e.target.value }))} className="w-full border rounded px-3 py-2">
                <option value="all">Whole School</option>
                <option value="class">Specific Class</option>
                <option value="student">Particular Student</option>
              </select>
            </div>
            {editDraft.targetType==='class' && (
              <div>
                <label className="block text-sm mb-1">Class</label>
                <select value={editDraft.className || ''} onChange={e=>setEditDraft((d:any)=>({ ...d, className: e.target.value }))} className="w-full border rounded px-3 py-2">
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {editDraft.targetType==='student' && (
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Student</label>
                <input
                  value={studentQuickFilter}
                  onChange={e=>setStudentQuickFilter(e.target.value)}
                  placeholder="Filter by Roll or GR"
                  className="w-full border rounded px-3 py-2 mb-2 text-sm"
                />
                <select value={editDraft.studentId || ''} onChange={e=>setEditDraft((d:any)=>({ ...d, studentId: e.target.value }))} className="w-full border rounded px-3 py-2">
                  <option value="">Select Student</option>
                  {students
                    .filter(s => {
                      const q = studentQuickFilter.trim().toLowerCase();
                      if (!q) return true;
                      const roll = String((s as any).rollNumber || '').toLowerCase();
                      const gr = String((s as any).grNumber || '').toLowerCase();
                      return roll.includes(q) || gr.includes(q);
                    })
                    .map(s => <option key={s._id} value={s._id}>{s.fullName} — {(s as any).grNumber} — Roll {(s as any).rollNumber}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Questions</h4>
              <div className="flex items-center gap-2">
                <button onClick={()=>setEditDraft((d:any)=>({ ...d, questions: [...(d.questions||[]), { _key: genId(), question: '', options: ['', '', '', ''], correctIndex: 0, difficulty: 'easy' }] }))} className="text-sm px-2 py-1 border rounded inline-flex items-center gap-1"><Plus size={14}/> Add</button>
                <button onClick={()=>{
                  try {
                    const data = JSON.stringify((editDraft.questions||[]).map((q:any)=>({ question:q.question, options:q.options, correctIndex:q.correctIndex, difficulty:q.difficulty||'easy' })), null, 2)
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `quiz_questions_${(editDraft.title||'').replace(/\s+/g,'_')||'untitled'}.json`; a.click(); URL.revokeObjectURL(url)
                  } catch { alert('Failed to export questions') }
                }} className="text-sm px-2 py-1 border rounded">Export</button>
                <label className="text-sm px-2 py-1 border rounded cursor-pointer">
                  Import
                  <input type="file" accept=".json,.csv" className="hidden" onChange={async (e)=>{
                    const file = e.target.files?.[0]
                    if (!file) return
                    const text = await file.text()
                    let imported: any[] = []
                    try {
                      if (file.name.endsWith('.json')) {
                        imported = JSON.parse(text)
                      } else {
                        // very simple CSV: question, option1, option2, option3, option4, correctIndex (0-3), difficulty
                        imported = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(line=>{
                          const parts = line.split(',').map(p=>p.trim())
                          const [question, o1, o2, o3, o4, idx, diff] = parts
                          return { question, options: [o1,o2,o3,o4], correctIndex: Number(idx||0), difficulty: (diff as any)||'easy' }
                        })
                      }
                      if (!Array.isArray(imported) || imported.length===0) throw new Error('No questions found')
                      const normalized = imported.map((q:any)=>({ _key: genId(), question: String(q.question||''), options: Array.isArray(q.options)? q.options.slice(0,4).map((s:any)=>String(s||'')) : [String(q.o1||''),String(q.o2||''),String(q.o3||''),String(q.o4||'')], correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex||0))), difficulty: ['easy','medium','hard'].includes((q.difficulty||'easy')) ? q.difficulty : 'easy' }))
                      setEditDraft((d:any)=>({ ...d, questions: normalized }))
                    } catch (err:any) {
                      alert(err?.message || 'Failed to import')
                    } finally { (e.target as HTMLInputElement).value = '' }
                  }} />
                </label>
              </div>
            </div>
            <div className="max-h-80 overflow-auto space-y-3 pr-1">
              {(editDraft.questions || []).map((q:any, idx:number) => (
                <div key={q._key || idx} className="border rounded p-3 bg-gray-50">
                  <label className="block text-sm mb-1">Question {idx+1}</label>
                  <input value={q.question} onChange={e=>setEditDraft((d:any)=>({ ...d, questions: d.questions.map((qq:any,i:number)=> i===idx ? { ...qq, question: e.target.value } : qq) }))} className="w-full border rounded px-3 py-2 mb-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt:string, oi:number) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`edit-correct-${idx}`} checked={q.correctIndex===oi} onChange={()=>setEditDraft((d:any)=>({ ...d, questions: d.questions.map((qq:any,i:number)=> i===idx ? { ...qq, correctIndex: oi } : qq) }))} />
                        <input value={opt} onChange={e=>setEditDraft((d:any)=>{ const arr = [...d.questions[idx].options]; arr[oi] = e.target.value; const qs = d.questions.map((qq:any,i:number)=> i===idx ? { ...qq, options: arr } : qq); return { ...d, questions: qs } })} className="flex-1 border rounded px-3 py-2" placeholder={`Option ${oi+1}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Difficulty</label>
                      <select value={q.difficulty || 'easy'} onChange={e=>setEditDraft((d:any)=>({ ...d, questions: d.questions.map((qq:any,i:number)=> i===idx ? { ...qq, difficulty: e.target.value } : qq) }))} className="border rounded px-2 py-1 text-xs">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <button onClick={()=>setEditDraft((d:any)=>({ ...d, questions: d.questions.filter((_:any,i:number)=>i!==idx) }))} className="px-2 py-1 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14}/> Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={()=>setShowEditModal(false)} className="px-3 py-2 border rounded">Cancel</button>
            <button onClick={async ()=>{ try { if (typeof editDraft.questionLimit !== 'number' || !(editDraft.questionLimit >= 1 && editDraft.questionLimit <= 200)) { alert('Total Questions is required (1-200)'); return } if(!(editDraft as any).examKey || String((editDraft as any).examKey).trim()===''){ alert('Exam Key is required'); return } setSaving(true); const res = await fetch('/api/quizzes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editDraft._id, title: editDraft.title, subject: editDraft.subject, examKey: (editDraft as any).examKey, targetType: editDraft.targetType, className: editDraft.className || undefined, studentId: editDraft.studentId || undefined, durationMinutes: editDraft.durationMinutes || undefined, questionLimit: editDraft.questionLimit, questions: (editDraft.questions||[]).map((q:any)=>({ question: q.question, options: q.options, correctIndex: q.correctIndex, difficulty: q.difficulty || 'easy' })) }) }); const j = await res.json(); if (!j?.ok) throw new Error(j?.error || 'Failed'); setItems(prev => prev.map(it => it._id === editDraft._id ? { ...it, ...editDraft, student: editDraft.studentId ? { _id: editDraft.studentId, fullName: it.student?.fullName || 'Student' } : undefined } : it)); setShowEditModal(false) } catch (e:any) { alert(e?.message || 'Failed to update') } finally { setSaving(false) } }} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16}/> : <Edit2 size={16}/>} Save</button>
          </div>
        </div>
      </div>
    )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={form.title} onChange={e=>setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g. Physics Unit Test" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input value={form.subject} onChange={e=>setForm({ ...form, subject: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g. Physics" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Exam Key (required)</label>
            <input value={form.examKey} onChange={e=>setForm({ ...form, examKey: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g. SPRING-2025" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input type="number" min={1} max={600} value={form.durationMinutes as any} onChange={e=>setForm({ ...form, durationMinutes: e.target.value ? Number(e.target.value) : '' })} className="w-full border rounded px-3 py-2" placeholder="e.g. 30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total Questions (required)</label>
            <input type="number" min={1} max={200} value={form.questionLimit as any} onChange={e=>setForm({ ...form, questionLimit: e.target.value ? Number(e.target.value) : '' })} className="w-full border rounded px-3 py-2" placeholder="e.g. 20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target</label>
            <select value={form.targetType} onChange={e=>setForm({ ...form, targetType: e.target.value as any })} className="w-full border rounded px-3 py-2">
              <option value="all">Whole School</option>
              <option value="class">Specific Class</option>
              <option value="student">Particular Student</option>
            </select>
          </div>
          {form.targetType==='class' && (
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={form.className} onChange={e=>setForm({ ...form, className: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select Class</option>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {form.targetType==='student' && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Student</label>
              <input
                value={studentQuickFilter}
                onChange={e=>setStudentQuickFilter(e.target.value)}
                placeholder="Filter by Roll or GR"
                className="w-full border rounded px-3 py-2 mb-2 text-sm"
              />
              <select value={form.studentId} onChange={e=>setForm({ ...form, studentId: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select Student</option>
                {students
                  .filter(s => {
                    const q = studentQuickFilter.trim().toLowerCase();
                    if (!q) return true;
                    const roll = String((s as any).rollNumber || '').toLowerCase();
                    const gr = String((s as any).grNumber || '').toLowerCase();
                    return roll.includes(q) || gr.includes(q);
                  })
                  .map(s => <option key={s._id} value={s._id}>{s.fullName} — {(s as any).grNumber} — Roll {(s as any).rollNumber}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Questions</h4>
            <div className="flex items-center gap-2">
              <button onClick={addQuestion} className="text-sm px-2 py-1 border rounded inline-flex items-center gap-1"><Plus size={14}/> Add</button>
              <button onClick={()=>{
                try {
                  const data = JSON.stringify(form.questions.map(q=>({ question:q.question, options:q.options, correctIndex:q.correctIndex, difficulty:q.difficulty||'easy' })), null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `quiz_questions_${(form.title||'').replace(/\s+/g,'_')||'untitled'}.json`; a.click(); URL.revokeObjectURL(url)
                } catch { alert('Failed to export questions') }
              }} className="text-sm px-2 py-1 border rounded">Export</button>
              <label className="text-sm px-2 py-1 border rounded cursor-pointer">
                Import
                <input type="file" accept=".json,.csv" className="hidden" onChange={async (e)=>{
                  const file = e.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  let imported: any[] = []
                  try {
                    if (file.name.endsWith('.json')) {
                      imported = JSON.parse(text)
                    } else {
                      imported = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(line=>{
                        const parts = line.split(',').map(p=>p.trim())
                        const [question, o1, o2, o3, o4, idx, diff] = parts
                        return { question, options: [o1,o2,o3,o4], correctIndex: Number(idx||0), difficulty: (diff as any)||'easy' }
                      })
                    }
                    if (!Array.isArray(imported) || imported.length===0) throw new Error('No questions found')
                    const normalized = imported.map((q:any)=>({ _key: genId(), question: String(q.question||''), options: Array.isArray(q.options)? q.options.slice(0,4).map((s:any)=>String(s||'')) : [String(q.o1||''),String(q.o2||''),String(q.o3||''),String(q.o4||'')], correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex||0))), difficulty: ['easy','medium','hard'].includes((q.difficulty||'easy')) ? q.difficulty : 'easy' }))
                    setForm(f=>({ ...f, questions: normalized }))
                  } catch (err:any) {
                    alert(err?.message || 'Failed to import')
                  } finally { (e.target as HTMLInputElement).value = '' }
                }} />
              </label>
            </div>
          </div>
          <div className="space-y-4">
            {form.questions.map((q, idx) => (
              <div key={q._key || idx} className="border rounded p-3 bg-gray-50">
                <label className="block text-sm mb-1">Question {idx+1}</label>
                <input value={q.question} onChange={e=>updateQuestion(idx, { question: e.target.value })} className="w-full border rounded px-3 py-2 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${idx}`} checked={q.correctIndex===oi} onChange={()=>updateQuestion(idx, { correctIndex: oi })} />
                      <input value={opt} onChange={e=>{
                        const arr = [...q.options]; arr[oi] = e.target.value; updateQuestion(idx, { options: arr })
                      }} className="flex-1 border rounded px-3 py-2" placeholder={`Option ${oi+1}`} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Difficulty</label>
                    <select value={q.difficulty || 'easy'} onChange={e=>updateQuestion(idx, { difficulty: e.target.value as any })} className="border rounded px-2 py-1 text-xs">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <button onClick={()=>removeQuestion(idx)} className="px-2 py-1 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14}/> Remove Question</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Create Quiz</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><RefreshCw size={18}/> All Quizzes</h3>
          <button onClick={async ()=>{ onLoadingChange?.(true); setLoading(true); try { const res = await fetch('/api/quizzes?limit=100', { cache: 'no-store' }); const j = await res.json(); if (j?.ok) setItems(j.data) } finally { setLoading(false); onLoadingChange?.(false) } }} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded border bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-2"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">No quizzes yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map(q => (
              <div key={q._id} className="p-3 rounded border bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-800 flex flex-wrap items-center gap-2">
                      {q.title} <span className="text-xs text-gray-500">({q.subject})</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${q.targetType==='all' ? 'bg-blue-50 text-blue-700 border-blue-200' : q.targetType==='class' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{q.targetType.toUpperCase()}</span>
                      {q.resultsAnnounced ? <span className="inline-flex items-center gap-1 text-emerald-700 text-xs"><CheckCircle2 size={14}/> Results Announced</span> : <span className="text-xs text-amber-700">Results Hidden</span>}
                    </div>
                    <div className="text-xs text-gray-500">{new Date((q as any).createdAt || (q as any)._createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>{ setEditDraft({ ...q, studentId: q.student?._id || '' }); setShowEditModal(true) }} className="px-2 py-1 text-xs border rounded inline-flex items-center gap-1"><Edit2 size={14}/> Edit</button>
                    <button onClick={()=>deleteQuiz(q._id)} disabled={workingId===q._id} className="px-2 py-1 text-xs border rounded text-red-600 inline-flex items-center gap-1"><Trash2 size={14}/> Delete</button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-4">
                  <span>Target: {q.targetType}{q.className ? ` (${q.className})` : ''}{q.student?.fullName ? ` (${q.student.fullName})` : ''}</span>
                  <span>Total Questions: {q.questionLimit ?? (q.questions?.length || 0)}</span>
                  {typeof q.durationMinutes === 'number' && <span>Duration: {q.durationMinutes} min</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminQuiz

 "use client"

import React, { useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import type { Student } from '@/types/student'
import { RotateCw, CheckCircle2 } from 'lucide-react'

const classes = ['KG','1','2','3','4','5','6','7','8','SSCI','SSCII']

type Entry = {
  studentId: string
  studentName: string
  fatherName: string
  rollNumber: string
  grNumber: string
  className: string
  marks: (number | null)[]
  percentage: number
  grade: string
  remarks: string
}

const AdminResult = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [className, setClassName] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [subjectsCount, setSubjectsCount] = useState<number>(0)
  const [subjects, setSubjects] = useState<string[]>([])
  const [step, setStep] = useState<'setup'|'table'>('setup')

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [existingResults, setExistingResults] = useState<any[]>([])
  const [maxMarksPerSubject, setMaxMarksPerSubject] = useState<number>(100)
  const [minPassPercentage, setMinPassPercentage] = useState<number>(40)
  const [examTitles, setExamTitles] = useState<string[]>([])

  // Marks state: studentId -> number[]
  const [marksMap, setMarksMap] = useState<Record<string, (number | null)[]>>({})

  // Load classes available in Sanity (unique admissionFor values)
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const list = await client.fetch("*[_type == 'student' && defined(admissionFor)].admissionFor")
        const unique = Array.from(new Set((Array.isArray(list) ? list : []).map((v: any)=> String(v))))
        // Sort using existing order fallback
        const order = (c: string) => {
          const idx = classes.indexOf(c)
          if (idx >= 0) return idx
          const n = parseInt(c, 10)
          return isNaN(n) ? 999 : n
        }
        unique.sort((a,b)=> order(a) - order(b))
        setAvailableClasses(unique)
      } catch {}
    }
    loadClasses()
  }, [])

  // Load students when class and step is table
  useEffect(() => {
    const load = async () => {
      if (step !== 'table' || !className) return
      setLoading(true); onLoadingChange?.(true)
      try {
        const data: Student[] = await client.fetch(getAllStudentsQuery)
        const filtered = (Array.isArray(data) ? data : []).filter(s => (s.admissionFor || '') === className)
        // sort by rollNumber numeric
        const num = (v: string) => { const n = parseInt((v||'').replace(/[^0-9]/g,''),10); return isNaN(n)? Number.POSITIVE_INFINITY : n }
        filtered.sort((a,b)=> num(a.rollNumber) - num(b.rollNumber))
        setStudents(filtered)
        // init marks map if empty
        const init: Record<string, (number | null)[]> = {}
        for (const s of filtered) { init[s._id || s.grNumber] = Array.from({ length: subjects.length }, () => null) }
        setMarksMap(prev => Object.keys(prev).length ? prev : init)
      } finally { setLoading(false); onLoadingChange?.(false) }
    }
    load()
  }, [step, className, subjects.length, onLoadingChange])

  // Load existing saved results for given class and examTitle (when in table step)
  useEffect(() => {
    const loadExisting = async () => {
      if (step !== 'table' || !className || !examTitle.trim()) { setExistingResults([]); return }
      try {
        const docs = await client.fetch(
          `*[_type == "result" && className == $cls && examTitle == $title]{
            _id, studentName, fatherName, rollNumber, grNumber, className, subjects, marks, percentage, grade, remarks, createdAt
          } | order(studentName asc)`,
          { cls: className, title: examTitle.trim() }
        )
        setExistingResults(Array.isArray(docs) ? docs : [])
      } catch { setExistingResults([]) }
    }
    loadExisting()
  }, [step, className, examTitle])

  // Load all exam titles (optionally filter by selected class)
  useEffect(() => {
    const loadTitles = async () => {
      try {
        const docs = await client.fetch(`*[_type == "result"${className ? ' && className == $cls' : ''}][]{ examTitle }`, className ? { cls: className } : {})
        const uniq = Array.from(new Set((Array.isArray(docs) ? docs : []).map((d:any)=> String(d?.examTitle || '')).filter(Boolean)))
        setExamTitles(uniq)
      } catch { setExamTitles([]) }
    }
    loadTitles()
  }, [className, savedOk])

  const canContinue = useMemo(() => {
    if (!className) return false
    if (!examTitle.trim()) return false
    if (!subjectsCount || subjectsCount < 1) return false
    if (subjects.length !== subjectsCount) return false
    if (subjects.some(s=>!s.trim())) return false
    if (!maxMarksPerSubject || maxMarksPerSubject <= 0) return false
    if (minPassPercentage < 0 || minPassPercentage > 100) return false
    return true
  }, [className, examTitle, subjectsCount, subjects, maxMarksPerSubject, minPassPercentage])

  const handleSubjectsCount = (n: number) => {
    setSubjectsCount(n)
    setSubjects(prev => {
      const arr = [...prev]
      if (n > arr.length) {
        return [...arr, ...Array.from({ length: n - arr.length }, () => '')]
      } else {
        return arr.slice(0, n)
      }
    })
    // reset marks when count changes
    setMarksMap({})
  }

  const onChangeSubject = (idx: number, value: string) => {
    setSubjects(prev => prev.map((s,i)=> i===idx ? value : s))
  }

  const gradeOf = (pct: number) => pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= minPassPercentage ? 'D' : 'F'
  const remarksOf = (pct: number) => pct >= minPassPercentage ? 'Pass' : 'Fail'

  const entries: Entry[] = useMemo(() => {
    const perMax = Math.max(1, Number(maxMarksPerSubject) || 100)
    const totalMax = subjects.length * perMax
    return students.map(s => {
      const id = s._id || s.grNumber
      const rowMarks = (marksMap[id] || Array.from({ length: subjects.length }, () => null))
      const obtained = rowMarks.reduce((acc: number, b: number | null) => acc + (b == null ? 0 : (Number(b) || 0)), 0)
      const pct = totalMax > 0 ? Math.round((obtained / totalMax) * 100) : 0
      return {
        studentId: s._id || '',
        studentName: s.fullName,
        fatherName: s.fatherName,
        rollNumber: s.rollNumber,
        grNumber: s.grNumber,
        className: s.admissionFor,
        marks: rowMarks,
        percentage: pct,
        grade: gradeOf(pct),
        remarks: remarksOf(pct),
      }
    })
  }, [students, marksMap, subjects.length, maxMarksPerSubject, minPassPercentage])

  const setMark = (studentKey: string, subjIndex: number, value: string) => {
    const perMax = Math.max(1, Number(maxMarksPerSubject) || 100)
    const n = value === '' ? null : Math.max(0, Math.min(perMax, Number(value) || 0))
    setMarksMap(prev => ({
      ...prev,
      [studentKey]: (prev[studentKey]
        ? prev[studentKey].map((v,i)=> i===subjIndex ? (n as any) : v)
        : Array.from({ length: subjects.length }, (_,i)=> i===subjIndex ? (n as any) : null))
    }))
  }

  const handleSave = async () => {
    if (!subjects.length || students.length===0) return
    setSaving(true); setSavedOk(false)
    try {
      const payload = {
        className,
        examTitle: examTitle.trim(),
        maxMarksPerSubject,
        minPassPercentage,
        subjects,
        entries: entries.map(e => ({
          studentId: e.studentId,
          studentName: e.studentName,
          fatherName: e.fatherName,
          rollNumber: e.rollNumber,
          grNumber: e.grNumber,
          className: e.className,
          marks: e.marks.map(m => m==null ? 0 : Number(m)),
          percentage: e.percentage,
          grade: e.grade,
          remarks: e.remarks,
        }))
      }
      const res = await fetch('/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json().catch(()=>({}))
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
      setSavedOk(true)
    } catch (e: any) {
      alert(`Save failed: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === 'setup' && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={className} onChange={e=>setClassName(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Select Class</option>
                {(availableClasses.length ? availableClasses : classes).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exam Title</label>
              <input value={examTitle} onChange={e=>setExamTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. Mid Term 2025" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">How many subjects?</label>
              <input type="number" min={1} max={15} value={subjectsCount || ''} onChange={e=>handleSubjectsCount(Number(e.target.value))} className="w-full border rounded px-3 py-2" placeholder="e.g. 6" />
            </div>
            <div className="flex items-end">
              <button disabled={!canContinue} onClick={()=>setStep('table')} className={`px-4 py-2 rounded ${canContinue ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>Continue</button>
            </div>
          </div>
          {subjectsCount > 0 && (
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              {Array.from({ length: subjectsCount }).map((_,i)=> (
                <div key={i}>
                  <label className="block text-xs text-gray-600 mb-1">Subject {i+1}</label>
                  <input value={subjects[i] || ''} onChange={e=>onChangeSubject(i, e.target.value)} className="w-full border rounded px-3 py-2" placeholder={`Subject ${i+1} name`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'table' && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-700">Class: <span className="font-semibold">{className}</span> • Exam: <span className="font-semibold">{examTitle}</span> • Subjects: {subjects.join(', ')}</div>
            <div className="flex items-center gap-2">
              <button onClick={()=>{ setStep('setup'); setSavedOk(false) }} className="px-3 py-2 border rounded">Back</button>
              <button onClick={()=>{ setStudents([]); setMarksMap({}); setSavedOk(false) }} className="px-3 py-2 border rounded inline-flex items-center gap-2"><RotateCw size={16}/> Reset Marks</button>
              <button onClick={handleSave} disabled={saving || students.length===0 || !examTitle.trim()} className={`px-4 py-2 rounded ${saving? 'bg-gray-300' : 'bg-emerald-600 text-white'}`}>{saving ? 'Saving...' : 'Enter'}</button>
            </div>
          </div>
          {savedOk && (
            <div className="mb-3 p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm inline-flex items-center gap-2"><CheckCircle2 size={16}/> Results saved</div>
          )}
          {loading ? (
            <div className="text-sm text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-sm text-gray-500">No students found for selected class.</div>
          ) : (
            <table className="min-w-[900px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2">S#</th>
                  <th className="p-2">Student Name</th>
                  <th className="p-2">Father Name</th>
                  <th className="p-2">Roll No</th>
                  <th className="p-2">GR Number</th>
                  {subjects.map((s, i)=> <th key={i} className="p-2">{s || `Subject ${i+1}`}</th>)}
                  <th className="p-2">Percentage</th>
                  <th className="p-2">Grade</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s,idx)=> {
                  const sid = s._id || s.grNumber
                  const row = entries[idx]
                  const rowMarks = marksMap[sid] || Array.from({ length: subjects.length }, () => 0)
                  return (
                    <tr key={sid} className="border-b">
                      <td className="p-2">{idx+1}</td>
                      <td className="p-2">{s.fullName}</td>
                      <td className="p-2">{s.fatherName}</td>
                      <td className="p-2">{s.rollNumber}</td>
                      <td className="p-2">{s.grNumber}</td>
                      {subjects.map((_,i)=> (
                        <td key={i} className="p-1">
                          <input
                            type="number"
                            min={0}
                            max={maxMarksPerSubject}
                            value={rowMarks[i] == null ? '' : rowMarks[i]}
                            onChange={e=> setMark(sid, i, e.target.value)}
                            className="w-20 border rounded px-2 py-1"
                          />
                        </td>
                      ))}
                      <td className="p-2">{row?.percentage ?? 0}%</td>
                      <td className="p-2">{row?.grade ?? '-'}</td>
                      <td className="p-2">{row?.remarks ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={async ()=>{
                if (!examTitle.trim() || !className) return alert('Select class and exam title')
                if (!confirm(`Delete all results for "${examTitle}" in class "${className}"?`)) return
                try {
                  const res = await fetch(`/api/results?className=${encodeURIComponent(className)}&examTitle=${encodeURIComponent(examTitle)}`, { method: 'DELETE' })
                  const j = await res.json().catch(()=>({}))
                  if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
                  setExistingResults([])
                  setSavedOk(false)
                  alert('Deleted')
                } catch (e:any) {
                  alert(`Delete failed: ${e?.message || e}`)
                }
              }}
              className="px-3 py-2 border border-red-300 text-red-700 rounded"
            >Delete All (This Exam)</button>
          </div>
          {/* Existing saved results for this Exam Title */}
          {!!existingResults.length && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">Saved Results for "{examTitle}"</div>
              <div className="overflow-auto">
                <table className="min-w-[900px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-2">Student</th>
                      <th className="p-2">GR</th>
                      <th className="p-2">Roll</th>
                      {(existingResults[0]?.subjects || subjects).map((s: string, i: number)=> <th key={i} className="p-2">{s || `S${i+1}`}</th>)}
                      <th className="p-2">%</th>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingResults.map((r, idx) => (
                      <tr key={r._id || idx} className="border-b">
                        <td className="p-2">{r.studentName}</td>
                        <td className="p-2">{r.grNumber}</td>
                        <td className="p-2">{r.rollNumber}</td>
                        {(r.subjects || subjects).map((_: string, i: number)=> (
                          <td key={i} className="p-2">{Number(r.marks?.[i] ?? 0)}</td>
                        ))}
                        <td className="p-2">{r.percentage}%</td>
                        <td className="p-2">{r.grade}</td>
                        <td className="p-2">{r.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Show result subsection (in setup step) */}
      {step === 'setup' && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <div className="text-sm font-semibold text-gray-700 mb-3">Show result</div>
          {examTitles.length === 0 ? (
            <div className="text-sm text-gray-500">No saved exam titles found.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {examTitles.map(title => (
                <button
                  key={title}
                  onClick={async ()=>{
                    if (!className) { alert('Please select a Class first'); return }
                    try {
                      // Fetch saved config for this exam to hydrate subjects/max/min
                      const cfg = await client.fetch(
                        `*[_type == "result" && className == $cls && examTitle == $title][0]{ subjects, maxMarksPerSubject, minPassPercentage }`,
                        { cls: className, title }
                      )
                      const subs: string[] = Array.isArray(cfg?.subjects) ? cfg.subjects : []
                      if (subs.length > 0) {
                        setSubjects(subs)
                        setSubjectsCount(subs.length)
                      }
                      if (cfg?.maxMarksPerSubject) setMaxMarksPerSubject(Number(cfg.maxMarksPerSubject))
                      if (cfg?.minPassPercentage != null) setMinPassPercentage(Number(cfg.minPassPercentage))
                      setExamTitle(title)
                      setStep('table')
                    } catch {
                      setExamTitle(title)
                      setStep('table')
                    }
                  }}
                  className="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm"
                >
                  {title}
                </button>
              ))}
            </div>
          )}
          {/* Delete All button here too for convenience when a title is selected */}
          <div className="mt-3">
            <button
              onClick={async ()=>{
                if (!className || !examTitle.trim()) { alert('Select Class and Exam Title'); return }
                if (!confirm(`Delete all results for "${examTitle}" in class "${className}"?`)) return
                try {
                  const res = await fetch(`/api/results?className=${encodeURIComponent(className)}&examTitle=${encodeURIComponent(examTitle)}`, { method: 'DELETE' })
                  const j = await res.json().catch(()=>({}))
                  if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
                  setExistingResults([])
                  setSavedOk(false)
                  alert('Deleted')
                } catch (e:any) {
                  alert(`Delete failed: ${e?.message || e}`)
                }
              }}
              className="px-3 py-2 border border-red-300 text-red-700 rounded"
            >Delete All (This Exam)</button>
          </div>
          {/* Danger Zone: Delete ALL results in schema */}
          <div className="mt-6 border-t pt-4">
            <div className="text-sm font-semibold text-red-700 mb-2">Danger Zone</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async ()=>{
                  if (!confirm('Delete ALL Manual Results (result) from Sanity? This cannot be undone.')) return
                  try {
                    const res = await fetch('/api/results?all=true&type=manual', { method: 'DELETE' })
                    const j = await res.json().catch(()=>({}))
                    if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
                    setExistingResults([])
                    setExamTitles([])
                    alert('All manual results deleted')
                  } catch (e:any) { alert(`Delete failed: ${e?.message || e}`) }
                }}
                className="px-3 py-2 border border-red-300 text-red-700 rounded"
              >Delete ALL Manual Results</button>
              <button
                onClick={async ()=>{
                  if (!confirm('Delete ALL Quiz Results (quizResult) from Sanity? This cannot be undone.')) return
                  try {
                    const res = await fetch('/api/results?all=true&type=quiz', { method: 'DELETE' })
                    const j = await res.json().catch(()=>({}))
                    if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
                    alert('All quiz results deleted')
                  } catch (e:any) { alert(`Delete failed: ${e?.message || e}`) }
                }}
                className="px-3 py-2 border border-red-300 text-red-700 rounded"
              >Delete ALL Quiz Results</button>
              <button
                onClick={async ()=>{
                  if (!confirm('Delete ALL Results (manual + quiz) from Sanity? This cannot be undone.')) return
                  try {
                    const res = await fetch('/api/results?all=true&type=both', { method: 'DELETE' })
                    const j = await res.json().catch(()=>({}))
                    if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`)
                    setExistingResults([])
                    setExamTitles([])
                    alert('All results deleted (manual + quiz)')
                  } catch (e:any) { alert(`Delete failed: ${e?.message || e}`) }
                }}
                className="px-3 py-2 border border-red-300 text-red-700 rounded"
              >Delete ALL Results</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminResult

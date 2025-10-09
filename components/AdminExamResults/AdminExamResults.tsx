"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import type { Student } from '@/types/student'
import { Plus, Pencil, Trash2, Download, Search, Filter, X } from 'lucide-react'

// Helpers
const gradeFromPercent = (pct: number) => pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'

const AdminExamResults = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  // Data
  const [students, setStudents] = useState<Student[]>([])
  // Single exam document
  const [examDoc, setExamDoc] = useState<any | null>(null)

  // UI state
  const [klass, setKlass] = useState<string>('')
  const [examTitle, setExamTitle] = useState<string>('Mid Term')
  const [subjectsCount, setSubjectsCount] = useState<number>(0)
  const [subjectNames, setSubjectNames] = useState<string[]>([])
  const [maxMarksPerSubject, setMaxMarksPerSubject] = useState<number>(100)
  const [minMarksPerSubject, setMinMarksPerSubject] = useState<number | undefined>(undefined)
  const [pastTitles, setPastTitles] = useState<string[]>([])

  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('All')
  const [filterSubject, setFilterSubject] = useState('All')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  // Modals
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<{ open: boolean; doc: any | null }>({ open: false, doc: null })
  const [form, setForm] = useState<any>({ studentId: '', marks: [] as any[] })
  // Row-click view modal (marksheet style)
  const [showView, setShowView] = useState<{ open: boolean; student: Student | null }>({ open: false, student: null })

  // Load students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true); onLoadingChange?.(true)
      const data: any[] = await client.fetch(getAllStudentsQuery)
      setStudents(data)
      setLoading(false); onLoadingChange?.(false)
    }
    fetchStudents()
  }, [onLoadingChange])

  // Derived classes
  const classOptions = useMemo(() => {
    const set = new Set<string>()
    for (const s of students) { const c = (s.admissionFor || '').toString().trim(); if (c) set.add(c) }
    return Array.from(set).sort()
  }, [students])

  // Adjust subject names array when count changes
  useEffect(() => {
    setSubjectNames(prev => {
      const next = [...prev]
      if (subjectsCount > next.length) {
        while (next.length < subjectsCount) next.push(`Subject ${next.length + 1}`)
      } else if (subjectsCount < next.length) {
        next.length = Math.max(0, subjectsCount)
      }
      return next
    })
  }, [subjectsCount])

  // Load Past Titles when class changes
  useEffect(() => {
    const loadTitles = async () => {
      if (!klass) { setPastTitles([]); return }
      try {
        const res = await fetch(`/api/exam-results?list=titles&className=${encodeURIComponent(klass)}`, { cache: 'no-store' })
        const j = await res.json()
        setPastTitles(j?.titles || [])
      } catch { setPastTitles([]) }
    }
    loadTitles()
  }, [klass])

  // Load single exam doc when class or exam changes
  useEffect(() => {
    const load = async () => {
      if (!klass) { setExamDoc(null); return }
      setLoading(true); onLoadingChange?.(true)
      try {
        if (!examTitle) { setExamDoc(null); return }
        const res = await fetch(`/api/exam-results?className=${encodeURIComponent(klass)}&examTitle=${encodeURIComponent(examTitle)}`, { cache: 'no-store' })
        const json = await res.json()
        if (json?.ok) {
          const doc = json.data
          setExamDoc(doc || null)
          if (doc?.subjects?.length) setSubjectNames(doc.subjects)
          if (doc?.maxMarksPerSubject) setMaxMarksPerSubject(Number(doc.maxMarksPerSubject))
          if (doc?.minMarksPerSubject != null) setMinMarksPerSubject(Number(doc.minMarksPerSubject))
        } else setExamDoc(null)
      } catch {
        setExamDoc(null)
      } finally { setLoading(false); onLoadingChange?.(false) }
    }
    load()
  }, [klass, examTitle, onLoadingChange])

  // Map for studentId => student result (from examDoc)
  const resultByStudent = useMemo(() => {
    const map = new Map<string, any>()
    const list = examDoc?.students || []
    for (const r of list) { const id = r.student?._id || ''; if (id) map.set(id, r) }
    return map
  }, [examDoc])

  // Students of selected class
  const classStudents = useMemo(() => students.filter(s => (s.admissionFor || '') === klass), [students, klass])

  // Filtered + searched rows
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = classStudents.filter(s => {
      const matchesTerm = !term ? true : [s.fullName, s.fatherName, s.rollNumber, s.grNumber].some((v: any) => String(v || '').toLowerCase().includes(term))
      if (!matchesTerm) return false
      const r = resultByStudent.get(s._id || '')
      if (filterGrade !== 'All') {
        const g = r?.grade || ''
        if (g !== filterGrade) return false
      }
      if (filterSubject !== 'All') {
        const idx = (examDoc?.subjects || []).findIndex((nm: string) => String(nm).toLowerCase() === filterSubject.toLowerCase())
        if (idx < 0) return false
      }
      return true
    })
    // Sort by roll number
    return filtered.sort((a, b) => {
      const ra = Number((a.rollNumber || '').toString().replace(/\D/g, ''))
      const rb = Number((b.rollNumber || '').toString().replace(/\D/g, ''))
      if (!Number.isNaN(ra) && !Number.isNaN(rb)) return ra - rb
      return String(a.rollNumber || '').localeCompare(String(b.rollNumber || ''))
    })
  }, [classStudents, search, resultByStudent, filterGrade, filterSubject, examDoc])

  const handleOpenAdd = (studentId?: string) => {
    setForm({
      studentId: studentId || '',
      className: klass || '',
      examTitle: examTitle || 'Mid Term',
      subjects: subjectNames,
      marks: subjectNames.map(() => ''),
      maxMarksPerSubject,
      minMarksPerSubject,
    })
    setShowAdd(true)
  }

  const handleSubmitAdd = async () => {
    if (!form.studentId || !form.className || !form.examTitle) return alert('Please fill required fields')
    if (!Array.isArray(form.subjects) || form.subjects.length === 0) return alert('Please define subjects')
    if (!Array.isArray(form.marks) || form.marks.length !== form.subjects.length) return alert('Marks should match subjects count')
    // Validation
    const marksPrepared = form.marks.map((m: any) => (m === '' || m == null) ? 0 : Number(m))
    for (const v of marksPrepared) { if (Number.isNaN(v) || v < 0 || v > Number(form.maxMarksPerSubject || 0)) return alert('Marks must be within 0..Max') }
    try {
      setWorking('add')
      const payload = { ...form, marks: marksPrepared }
      const res = await fetch('/api/exam-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!j?.ok) throw new Error(j?.error || 'Failed')
      setShowAdd(false)
      // reload
      const res2 = await fetch(`/api/exam-results?className=${encodeURIComponent(klass)}&examTitle=${encodeURIComponent(examTitle)}`, { cache: 'no-store' })
      const j2 = await res2.json(); if (j2?.ok) setExamDoc(j2.data)
    } catch (e: any) {
      alert(e?.message || 'Failed to add result')
    } finally { setWorking(null) }
  }

  const openEdit = (doc: any) => {
    setShowEdit({ open: true, doc })
    setForm({
      id: examDoc?._id,
      studentId: doc.student?._id || doc.studentId || '',
      className: klass,
      examTitle: examTitle,
      subjects: examDoc?.subjects || subjectNames,
      marks: (()=>{ const arr = (doc.marks || []).map((n: any) => (n == null ? '' : Number(n))); const need = (examDoc?.subjects || subjectNames).length; while(arr.length < need) arr.push(''); return arr })(),
      maxMarksPerSubject: examDoc?.maxMarksPerSubject || maxMarksPerSubject,
      minMarksPerSubject: examDoc?.minMarksPerSubject || minMarksPerSubject,
      studentName: doc.studentName,
      fatherName: doc.fatherName,
      rollNumber: doc.rollNumber,
      grNumber: doc.grNumber,
    })
  }

  const handleSubmitEdit = async () => {
    if (!form.id) return
    // validate marks
    if (!Array.isArray(form.marks) || form.marks.length !== (form.subjects || []).length) return alert('Marks should match subjects count')
    const marksPrepared = (form.marks || []).map((m: any) => (m === '' || m == null) ? 0 : Number(m))
    for (const v of marksPrepared) { if (Number.isNaN(v) || v < 0 || v > Number(form.maxMarksPerSubject || 0)) return alert('Marks must be within 0..Max') }
    try {
      setWorking('edit')
      const res = await fetch('/api/exam-results', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id, studentId: form.studentId, patch: { subjects: form.subjects, marks: marksPrepared, maxMarksPerSubject: form.maxMarksPerSubject, minMarksPerSubject: form.minMarksPerSubject } }) })
      const j = await res.json()
      if (!j?.ok) throw new Error(j?.error || 'Update failed')
      setShowEdit({ open: false, doc: null })
      // reload
      const res2 = await fetch(`/api/exam-results?className=${encodeURIComponent(klass)}&examTitle=${encodeURIComponent(examTitle)}`, { cache: 'no-store' })
      const j2 = await res2.json(); if (j2?.ok) setExamDoc(j2.data)
    } catch (e: any) { alert(e?.message || 'Failed to update') } finally { setWorking(null) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student result?')) return
    try {
      setWorking(id)
      if (!examDoc?._id) throw new Error('Missing exam document id')
      const res = await fetch(`/api/exam-results?id=${encodeURIComponent(examDoc._id)}&studentId=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const j = await res.json()
      if (!j?.ok) throw new Error(j?.error || 'Failed to delete')
      // reload
      const res2 = await fetch(`/api/exam-results?className=${encodeURIComponent(klass)}&examTitle=${encodeURIComponent(examTitle)}`, { cache: 'no-store' })
      const j2 = await res2.json(); if (j2?.ok) setExamDoc(j2.data)
    } catch (e: any) { alert(e?.message || 'Delete failed') } finally { setWorking(null) }
  }

  const generatePdf = async () => {
    if (!klass) return alert('Select class first')
    const jsPDFMod: any = await import('jspdf')
    const doc = new jsPDFMod.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40

    // Header
    doc.setFillColor(41,128,185)
    doc.rect(margin, margin, pageWidth - margin*2, 36, 'F')
    doc.setTextColor(255,255,255)
    doc.setFont('helvetica','bold')
    doc.setFontSize(16)
    doc.text('Al Ghazali High School', pageWidth/2, margin+22, { align: 'center' })
    doc.setFontSize(11)
    doc.text(`Exam Result Report • Class ${klass} • ${examTitle || ''}`, pageWidth/2, margin+36, { align: 'center' })

    // Table renderer with fixed column widths and header redraw
    doc.setTextColor(0,0,0)
    doc.setFont('helvetica','bold')
    doc.setFontSize(10)

    const staticCols = ['S#','Student','Father','Roll','GR']
    const tailCols = ['Min/Sub','Max/Sub','Obt.','%','Grade','Status','Remarks']
    const cols = [...staticCols, ...subjectNames, ...tailCols]
    const yHeader = margin + 60
    const x0 = margin

    // Define widths
    const widths: number[] = []
    const pushW = (n:number)=>widths.push(n)
    // Static widths
    pushW(24) /* S# */
    pushW(120) /* Student */
    pushW(110) /* Father */
    pushW(50) /* Roll */
    pushW(60) /* GR */
    // Subjects small fixed width
    subjectNames.forEach(()=>pushW(38))
    // Tail widths
    pushW(55) /* Min/Sub */
    pushW(55) /* Max/Sub */
    pushW(60) /* Obt. */
    pushW(35) /* % */
    pushW(45) /* Grade */
    pushW(55) /* Status */
    pushW(80) /* Remarks */

    const drawHeader = () => {
      doc.setFont('helvetica','bold')
      doc.setFontSize(9)
      let x = x0
      let ci = 0
      // Static headers
      staticCols.forEach(c=>{ doc.text(c, x+2, y); x += widths[ci++]; })
      // Subject headers rotated 90 degrees to fit narrow columns
      subjectNames.forEach((s)=>{
        const colW = widths[ci]
        const cx = x + colW/2
        // rotate around text position
        doc.text(String(s), cx, y, { align: 'center', angle: 90 as any })
        x += widths[ci++]
      })
      // Tail headers
      tailCols.forEach(c=>{ doc.text(c, x+2, y); x += widths[ci++]; })
      doc.setFont('helvetica','normal')
    }

    let y = yHeader
    drawHeader();
    y += 16

    const list = rows
    list.forEach((s, idx) => {
      const r = resultByStudent.get(s._id || '')
      const subj = subjectNames
      const marks: number[] = (r?.marks || []).map((n: any)=>Number(n))
      const maxPer = Number(examDoc?.maxMarksPerSubject || maxMarksPerSubject)
      const totalMax = subj.length * (maxPer || 0)
      const totalMarks = marks.reduce((a,b)=>a+(Number(b)||0),0)
      const pct = totalMax>0 ? Math.round((totalMarks/totalMax)*100) : 0
      const grade = gradeFromPercent(pct)
      const effMin = Number(examDoc?.minMarksPerSubject ?? minMarksPerSubject ?? 0)
      const hasFail = (marks.length === 0) || marks.some(m => (Number(m)||0) < effMin)
      const status = hasFail ? 'Fail' : 'Pass'
      const remarks = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Poor'

      let x = x0
      let ci = 0
      const rowVals = [String(idx+1), s.fullName || '', (s as any).fatherName || '', s.rollNumber || '', s.grNumber || '']
      // Static cells
      rowVals.forEach((v, i) => { doc.text(String(v||''), x+2, y); x += widths[ci++]; })
      // Subject marks
      subj.forEach((_, i)=>{ doc.text(String(marks[i] ?? '-'), x+widths[ci]/2, y, { align: 'center' }); x += widths[ci++]; })
      // Tail
      const rest = [String(effMin), String(maxPer), String(totalMarks), String(pct)+'%', grade, status, remarks]
      rest.forEach(v => { doc.text(String(v), x+2, y); x += widths[ci++]; })

      y += 14
      if (y > pageHeight - margin - 30) {
        doc.addPage()
        // Redraw header on new page
        y = margin + 20
        drawHeader();
        y += 16
      }
    })

    doc.save(`exam_results_class_${klass}_${(examTitle||'exam').replace(/\s+/g,'_')}.pdf`)
  }

  const generateStudentPdf = async (studentId: string) => {
    if (!klass) return alert('Select class first')
    const s = students.find(st => st._id === studentId)
    if (!s) return alert('Student not found')
    const r = resultByStudent.get(studentId)
    const subj = subjectNames
    const marks: number[] = (r?.marks || []).map((n: any)=>Number(n))
    const maxPer = Number(examDoc?.maxMarksPerSubject || maxMarksPerSubject)
    const totalMax = subj.length * (maxPer || 0)
    const totalMarks = marks.reduce((a,b)=>a+(Number(b)||0),0)
    const pct = totalMax>0 ? Math.round((totalMarks/totalMax)*100) : 0
    const grade = gradeFromPercent(pct)
    const effMin = Number(examDoc?.minMarksPerSubject ?? minMarksPerSubject ?? 0)
    const hasFail = marks.some(m => (Number(m)||0) < effMin)
    const status = hasFail ? 'Fail' : 'Pass'
    const remarks = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Poor'
    const jsPDFMod: any = await import('jspdf')
    const doc = new jsPDFMod.jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 50
    const contentWidth = pageWidth - margin * 2
    const sectionGap = 25
    let y = margin + 10

    // Helpers similar to AdminReports
    const fetchImageDataUrl = async (url: string): Promise<string | null> => {
      try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return null
        const blob = await res.blob()
        const reader = new FileReader()
        return await new Promise((resolve) => {
          reader.onloadend = () => resolve(String(reader.result || ''))
          reader.readAsDataURL(blob)
        })
      } catch { return null }
    }
    const tintImageAlpha = async (dataUrl: string, alpha: number, drawW: number, drawH: number) => {
      return new Promise<string>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const cw = Math.max(1, Math.floor(drawW))
            const ch = Math.max(1, Math.floor(drawH))
            canvas.width = cw; canvas.height = ch
            const ctx = canvas.getContext('2d')
            if (!ctx) { resolve(dataUrl); return }
            ctx.clearRect(0, 0, cw, ch)
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
            const iw = img.naturalWidth || img.width
            const ih = img.naturalHeight || img.height
            const scale = Math.max(cw / iw, ch / ih)
            const dw = iw * scale
            const dh = ih * scale
            const dx = (cw - dw) / 2
            const dy = (ch - dh) / 2
            ctx.drawImage(img, dx, dy, dw, dh)
            resolve(canvas.toDataURL('image/png'))
          } catch { resolve(dataUrl) }
        }
        img.onerror = () => resolve(dataUrl)
        img.src = dataUrl
      })
    }

    // Header (same palette as AdminReports but title for Marksheet)
    doc.setFillColor(83, 36, 42)
    doc.rect(margin, y - 5, contentWidth, 45, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.text('Al Ghazali High School', pageWidth / 2, y + 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Exam Marksheet • Class ${klass} • ${examTitle || ''}`, pageWidth / 2, y + 35, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 60
    y += 16 * 2

    // Watermark logo center
    try {
      let logoDataUrl = await fetchImageDataUrl('/logo.png')
      if (!logoDataUrl) logoDataUrl = await fetchImageDataUrl('/assets/logo.png')
      if (logoDataUrl) {
        const wmW = contentWidth * 0.6
        const wmH = (pageHeight - margin * 2) * 0.6
        const tint = await tintImageAlpha(logoDataUrl, 0.12, wmW, wmH)
        const wmX = margin + (contentWidth - wmW) / 2
        const wmY = margin + ((pageHeight - margin * 2) - wmH) / 2
        ;(doc as any).addImage(tint, 'PNG', wmX, wmY, wmW, wmH)
      }
    } catch {}

    // Photo block (top-left), QR optional removed for marksheet
    let photoAdded = false
    let photoX = margin
    let photoY = y - 10
    let photoW = 67
    let photoH = 67
    try {
      const possibleUrl = (s as any).photoUrl || (s as any).imageUrl
      if (typeof possibleUrl === 'string' && /^https?:\/\//i.test(possibleUrl)) {
        const dataUrl = await fetchImageDataUrl(possibleUrl)
        if (dataUrl) {
          const imgW = 67, imgH = 67
          const imgX = margin
          const imgY = y - 10
          photoX = imgX; photoY = imgY; photoW = imgW; photoH = imgH
          doc.setDrawColor(83, 36, 42)
          doc.setLineWidth(2)
          doc.rect(imgX - 2, imgY - 2, imgW + 4, imgH + 4, 'S')
          const fmt = /\.png($|\?)/i.test(possibleUrl) ? 'PNG' : 'JPEG'
          try { (doc as any).addImage(dataUrl, fmt, imgX, imgY, imgW, imgH); photoAdded = true } catch {}
        }
      }
    } catch {}

    // Summary block to right of photo
    const lineH = 16
    const summaryStartX = photoAdded ? (photoX + photoW + 18) : margin
    const summaryRightX = margin + contentWidth
    const kvSingle = (label: string, value: any, startX: number, maxRightX: number) => {
      const x = startX
      const labelWidth = 90
      const adjustedWidth = Math.max(60, maxRightX - x)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(70, 70, 70)
      doc.text(label + ':', x, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      const text = (value ?? '—').toString()
      const maxWidth = Math.max(40, adjustedWidth - labelWidth - 2)
      const wrapped = doc.splitTextToSize(text, maxWidth)
      doc.text(wrapped, x + labelWidth, y)
      const extra = Math.max(0, wrapped.length - 1) * 12
      y += 16 + extra
    }

    kvSingle('Student', (s as any).fullName, summaryStartX, summaryRightX)
    kvSingle('Father', (s as any).fatherName, summaryStartX, summaryRightX)
    kvSingle('Roll Number', (s as any).rollNumber, summaryStartX, summaryRightX)
    kvSingle('GR Number', (s as any).grNumber, summaryStartX, summaryRightX)

    if (photoAdded) y = Math.max(y, photoY + photoH) + 20
    else y += 10

    // Section: Exam Summary
    const section = (title: string) => {
      doc.setFillColor(255, 202, 124)
      doc.setDrawColor(83, 36, 42)
      doc.setLineWidth(1)
      doc.rect(margin, y - 8, contentWidth, 28, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(83, 36, 42)
      doc.text(title, margin + 12, y + 8)
      doc.setTextColor(0, 0, 0)
      y += 35
    }

    section('Exam Summary')
    doc.setFont('helvetica','normal')
    doc.setFontSize(10)
    const pair = (label: string, value: any, x: number) => {
      doc.setFont('helvetica','bold'); doc.setTextColor(70,70,70); doc.text(label+':', x, y)
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0); doc.text(String(value ?? '—'), x+110, y)
      y += 18
    }
    const leftX = margin
    const rightX = margin + (contentWidth/2) + 10
    pair('Max Marks / Subject', maxPer, leftX)
    pair('Min Marks / Subject', effMin, leftX)
    pair('Total Marks', `${totalMarks} / ${totalMax}`, rightX)
    pair('Percentage', `${pct}%`, rightX)
    pair('Grade', grade, rightX)
    y += sectionGap

    // Section: Subject-wise Marks
    section('Subject-wise Marks')
    doc.setFont('helvetica','bold')
    doc.text('Subject', margin + 8, y)
    doc.text('Marks', margin + 320, y)
    doc.setFont('helvetica','normal')
    let ty = y + 16
    subj.forEach((nm, i) => {
      doc.text(String(nm), margin + 8, ty)
      doc.text(String(marks[i] ?? '-'), margin + 320, ty)
      ty += 16
    })
    y = ty + 8
    doc.setFont('helvetica','bold')
    doc.text(`Status: ${status}`, margin + 8, y)
    doc.text(`Remarks: ${remarks}`, margin + 160, y)

    // Signature + Footer (same style spirit)
    const footerY = pageHeight - 20
    const now = new Date()
    const createdDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' })
    const createdTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
    const footerText = `Generated by IT Department - Al Ghazali High School | Created on ${createdDate} at ${createdTime} PKT`

    const sigY = Math.min(y + 60, footerY - 100)
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.5)
    doc.rect(margin, sigY - 15, contentWidth, 60, 'FD')
    const sigLineWidth = 140
    const sigGap = (contentWidth - sigLineWidth * 3) / 2
    const sigX1 = margin + 20
    const sigX2 = margin + sigLineWidth + sigGap
    const sigX3 = margin + (sigLineWidth + sigGap) * 2 - 20
    const actualSigY = sigY + 20
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(sigX1, actualSigY, sigX1 + sigLineWidth, actualSigY)
    doc.line(sigX2, actualSigY, sigX2 + sigLineWidth, actualSigY)
    doc.line(sigX3, actualSigY, sigX3 + sigLineWidth, actualSigY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    const labelY = actualSigY + 15
    doc.text('Class Teacher', sigX1 + sigLineWidth/2, labelY, { align: 'center' })
    doc.text('Parent/Guardian', sigX2 + sigLineWidth/2, labelY, { align: 'center' })
    doc.text('Principal', sigX3 + sigLineWidth/2, labelY, { align: 'center' })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(footerText, pageWidth / 2, footerY, { align: 'center' })

    doc.save(`marksheet_${(s.fullName||'student').replace(/\s+/g,'_')}_${(examTitle||'exam').replace(/\s+/g,'_')}.pdf`)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-sm text-gray-600">Class</label>
            <select value={klass} onChange={(e)=>setKlass(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Class</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Exam Title</label>
            <input value={examTitle} onChange={e=>setExamTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Mid Term"/>
          </div>
          <div>
            <label className="text-sm text-gray-600"># Subjects</label>
            <input type="number" min={0} value={subjectsCount} onChange={e=>setSubjectsCount(Number(e.target.value)||0)} className="w-full border rounded px-3 py-2"/>
          </div>
          <div>
            <label className="text-sm text-gray-600">Max Marks / Subject</label>
            <input type="number" min={1} value={maxMarksPerSubject} onChange={e=>setMaxMarksPerSubject(Number(e.target.value)||100)} className="w-full border rounded px-3 py-2"/>
          </div>
          <div>
            <label className="text-sm text-gray-600">Min Marks / Subject</label>
            <input type="number" min={0} value={minMarksPerSubject ?? ''} onChange={e=>{
              const v = e.target.value; setMinMarksPerSubject(v === '' ? undefined : Number(v))
            }} className="w-full border rounded px-3 py-2"/>
          </div>
        </div>
        {subjectsCount>0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
            {subjectNames.map((nm, i) => (
              <input key={i} value={nm} onChange={e=>{
                const v = e.target.value; setSubjectNames(prev=>{ const n=[...prev]; n[i]=v; return n })
              }} className="w-full border rounded px-3 py-2" placeholder={`Subject ${i+1}`}/>
            ))}
          </div>
        )}

      {/* View (Row Click) Modal */}
      {showView.open && showView.student && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={()=>setShowView({ open: false, student: null })}>
          <div className="bg-white rounded-xl w-full max-w-3xl p-4 max-h-[85vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Result Details</div>
              <button onClick={()=>setShowView({ open: false, student: null })} className="text-gray-600"><X size={18}/></button>
            </div>
            {(() => {
              const s = showView.student!
              const r = resultByStudent.get(s._id || '')
              const subj = subjectNames
              const marks: number[] = (r?.marks || []).map((n: any)=>Number(n))
              const maxPer = Number(examDoc?.maxMarksPerSubject || maxMarksPerSubject)
              const totalMax = subj.length * (maxPer || 0)
              const totalMarks = marks.reduce((a,b)=>a+(Number(b)||0),0)
              const pct = totalMax>0 ? Math.round((totalMarks/totalMax)*100) : 0
              const grade = r?.grade || gradeFromPercent(pct)
              const effMin = Number(examDoc?.minMarksPerSubject ?? minMarksPerSubject ?? 0)
              const hasFail = (marks.length === 0) || marks.some(m => (Number(m)||0) < effMin)
              const status = hasFail ? 'Fail' : 'Pass'
              const remarkText = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Poor'
              return (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span className="font-semibold">Student:</span> {s.fullName}</div>
                    <div><span className="font-semibold">Father:</span> {(s as any).fatherName || ''}</div>
                    <div><span className="font-semibold">Roll:</span> {s.rollNumber || ''}</div>
                    <div><span className="font-semibold">GR:</span> {s.grNumber || ''}</div>
                    <div><span className="font-semibold">Class:</span> {klass}</div>
                    <div><span className="font-semibold">Exam:</span> {examTitle}</div>
                  </div>
                  <div className="bg-white border rounded">
                    <div className="px-3 py-2 font-semibold border-b">Subject-wise Marks</div>
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {subj.map((nm, i) => (
                        <div key={i} className="flex justify-between border rounded px-2 py-1">
                          <span className="text-gray-600">{nm}</span>
                          <span className="font-medium">{marks[i] ?? '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Min/Sub</div><div className="font-semibold">{effMin}</div></div>
                    <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Max/Sub</div><div className="font-semibold">{maxPer}</div></div>
                    <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Total</div><div className="font-semibold">{totalMarks}/{totalMax}</div></div>
                    <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">%</div><div className="font-semibold">{pct}%</div></div>
                    <div className="bg-gray-50 rounded p-2"><div className="text-xs text-gray-500">Grade</div><div className="font-semibold">{grade}</div></div>
                    <div className={`bg-gray-50 rounded p-2 ${status==='Pass'?'text-green-600':'text-red-600'}`}><div className="text-xs text-gray-500 text-black/60">Status</div><div className="font-semibold">{status}</div></div>
                    <div className="bg-gray-50 rounded p-2 col-span-2"><div className="text-xs text-gray-500">Remarks</div><div className="font-semibold">{remarkText}</div></div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button onClick={()=>generateStudentPdf(s._id!)} className="px-3 py-2 border rounded inline-flex items-center gap-2"><Download size={16}/> Marksheet PDF</button>
                    {!r && <button onClick={()=>{ setShowView({ open:false, student:null }); handleOpenAdd(s._id!) }} className="px-3 py-2 rounded bg-blue-600 text-white">Add Result</button>}
                    {r && <button onClick={()=>{ setShowView({ open:false, student:null }); openEdit(r) }} className="px-3 py-2 rounded bg-blue-600 text-white inline-flex items-center gap-2"><Pencil size={16}/> Edit</button>}
                    {r && <button onClick={()=>{ handleDelete(r?.student?._id || s._id!); }} disabled={working===(r?.student?._id || s._id)} className="px-3 py-2 rounded border text-red-600 inline-flex items-center gap-2"><Trash2 size={16}/> Delete</button>}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
        {klass && pastTitles.length > 0 && (
          <div className="mt-3">
            <label className="text-sm text-gray-600">Past Results</label>
            <select value={examTitle} onChange={(e)=>setExamTitle(e.target.value)} className="w-full border rounded px-3 py-2">
              {[examTitle, ...pastTitles.filter(t=>t!==examTitle)].map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name, father, GR, Roll..." className="pl-9 pr-3 py-2 border rounded w-full"/>
        </div>
        <div className="flex gap-2">
          <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)} className="border rounded px-3 py-2">
            <option>All</option>
            {subjectNames.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} className="border rounded px-3 py-2">
            {['All','A+','A','B','C','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={generatePdf} disabled={!klass} className="px-3 py-2 border rounded inline-flex items-center gap-2"><Download size={16}/> Generate Report</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        {(!klass) ? (
          <div className="text-sm text-gray-500">Class select karein.</div>
        ) : loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full text-sm table-fixed">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">S#</th>
                <th className="p-2 text-left">Student Name</th>
                <th className="p-2 text-left">Father Name</th>
                <th className="p-2 text-left">Roll</th>
                <th className="p-2 text-left">GR</th>
                {subjectNames.map((s,i)=>(
                  <th key={i} className="p-2 text-center align-bottom w-10 min-w-[40px] max-w-[40px]">
                    <div className="h-24 flex items-end justify-center">
                      <span className="inline-block whitespace-nowrap [transform:rotate(-90deg)] text-xs">{s}</span>
                    </div>
                  </th>
                ))}
                <th className="p-2 text-left">Min/Sub</th>
                <th className="p-2 text-left">Max/Sub</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">%</th>
                <th className="p-2 text-left">Grade</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, idx) => {
                const r = resultByStudent.get(s._id || '')
                const subj = subjectNames
                const marks: number[] = (r?.marks || []).map((n: any)=>Number(n))
                const maxPer = Number(examDoc?.maxMarksPerSubject || maxMarksPerSubject)
                const totalMax = subj.length * (maxPer || 0)
                const totalMarks = marks.reduce((a,b)=>a+(Number(b)||0),0)
                const pct = totalMax>0 ? Math.round((totalMarks/totalMax)*100) : 0
                const grade = r?.grade || gradeFromPercent(pct)
                const effMin = Number(examDoc?.minMarksPerSubject ?? minMarksPerSubject ?? 0)
                const hasFail = (marks.length === 0) || marks.some(m => (Number(m)||0) < effMin)
                const status = hasFail ? 'Fail' : 'Pass'
                const remarkText = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Poor'
                return (
                  <tr key={s._id} className="border-b">
                    <td className="p-2">{idx+1}</td>
                    <td className="p-2">{s.fullName}</td>
                    <td className="p-2">{(s as any).fatherName || ''}</td>
                    <td className="p-2">{s.rollNumber}</td>
                    <td className="p-2">{s.grNumber}</td>
                    {subj.map((_, i) => (<td key={i} className="p-2 text-center w-10 min-w-[40px] max-w-[40px]">{marks[i] ?? '-'}</td>))}
                    <td className="p-2">{examDoc?.minMarksPerSubject ?? (minMarksPerSubject ?? '-')}</td>
                    <td className="p-2">{maxPer}</td>
                    <td className="p-2">{totalMarks}</td>
                    <td className="p-2">{pct}%</td>
                    <td className="p-2">{grade}</td>
                    <td className={`p-2 ${status==='Pass' ? 'text-green-600' : 'text-red-600'}`}>{status}</td>
                    <td className="p-2">{remarkText}</td>
                    <td className="p-2 space-x-2 whitespace-nowrap">
                      <button onClick={()=>handleOpenAdd(s._id!)} className="px-2 py-1 text-xs rounded bg-blue-600 text-white inline-flex items-center gap-1"><Plus size={12}/></button>
                      {r && <button onClick={()=>openEdit(r)} className="px-2 py-1 text-xs rounded border inline-flex items-center gap-1"><Pencil size={12}/></button>}
                      {r && <button onClick={()=>handleDelete(r?.student?._id || s._id!)} disabled={working===(r?.student?._id || s._id)} className="px-2 py-1 text-xs rounded border text-red-600 inline-flex items-center gap-1"><Trash2 size={12}/></button>}
                      {r && <button onClick={()=>generateStudentPdf(s._id!)} className="px-2 py-1 text-xs rounded border inline-flex items-center gap-1"><Download size={12}/> Marksheet</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Global Add button */}
      {klass && (
        <div className="flex justify-end">
          <div className="flex gap-2">
            <button
              onClick={async ()=>{
                if (!examDoc?._id && !(klass && examTitle)) { alert('No exam to delete'); return }
                const ok = confirm(`Delete ALL results for Class "${klass}" and Exam "${examTitle}"? This cannot be undone.`)
                if (!ok) return
                try {
                  setWorking('deleteAll')
                  const qs = examDoc?._id ? `id=${encodeURIComponent(examDoc._id)}` : `className=${encodeURIComponent(klass)}&examTitle=${encodeURIComponent(examTitle)}`
                  const res = await fetch(`/api/exam-results?${qs}`, { method: 'DELETE' })
                  const j = await res.json()
                  if (!j?.ok) throw new Error(j?.error || 'Delete all failed')
                  setExamDoc(null)
                } catch(e:any) {
                  alert(e?.message || 'Failed to delete all')
                } finally { setWorking(null) }
              }}
              disabled={!examDoc && !(klass && examTitle) || working==='deleteAll'}
              className="px-4 py-2 rounded border border-red-300 text-red-700 bg-white hover:bg-red-50 inline-flex items-center gap-2"
            >
              <Trash2 size={16}/> Delete All
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-2xl p-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Add Result</div>
              <button onClick={()=>setShowAdd(false)} className="text-gray-600"><X size={18}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Class</label>
                <select value={form.className} onChange={e=>setForm((p:any)=>({ ...p, className: e.target.value }))} className="w-full border rounded px-3 py-2">
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Exam Title</label>
                <input value={form.examTitle} onChange={e=>setForm((p:any)=>({ ...p, examTitle: e.target.value }))} className="w-full border rounded px-3 py-2"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm">Student</label>
                <select value={form.studentId} onChange={e=>setForm((p:any)=>({ ...p, studentId: e.target.value }))} className="w-full border rounded px-3 py-2">
                  <option value="">Select Student</option>
                  {students.filter(s=> (s.admissionFor||'')===form.className).map(s=> (<option key={s._id} value={s._id!}>{s.fullName} • {s.rollNumber || ''}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm">Max Marks / Subject</label>
                <input type="number" value={form.maxMarksPerSubject} onChange={e=>setForm((p:any)=>({ ...p, maxMarksPerSubject: Number(e.target.value)||100 }))} className="w-full border rounded px-3 py-2"/>
              </div>
              
              <div>
                <label className="text-sm">Min Marks / Subject</label>
                <input type="number" value={form.minMarksPerSubject ?? ''} onChange={e=>setForm((p:any)=>({ ...p, minMarksPerSubject: e.target.value===''? undefined : Number(e.target.value) }))} className="w-full border rounded px-3 py-2"/>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {subjectNames.map((nm, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{nm}</label>
                  <input type="number" min={0} value={form.marks?.[i] ?? ''} onChange={e=>{
                    const v = e.target.value; setForm((p:any)=>{ const arr=[...(p.marks||[])]; arr[i]=v===''? '' : Number(v); return { ...p, marks: arr } })
                  }} className="w-full border rounded px-3 py-2"/>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSubmitAdd} disabled={working==='add'} className="px-4 py-2 rounded bg-blue-600 text-white">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit.open && showEdit.doc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-2xl p-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">Edit Result</div>
              <button onClick={()=>setShowEdit({ open: false, doc: null })} className="text-gray-600"><X size={18}/></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {(examDoc?.subjects || subjectNames).map((nm: string, i: number) => (
                <div key={i} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{nm}</label>
                  <input type="number" min={0} value={form.marks?.[i] ?? ''} onChange={e=>{
                    const v = e.target.value; setForm((p:any)=>{ const arr=[...(p.marks||[])]; arr[i]=v===''? '' : Number(v); return { ...p, marks: arr } })
                  }} className="w-full border rounded px-3 py-2"/>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-sm">Max Marks / Subject</label>
                <input type="number" value={form.maxMarksPerSubject} onChange={e=>setForm((p:any)=>({ ...p, maxMarksPerSubject: Number(e.target.value)||100 }))} className="w-full border rounded px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm">Min Marks / Subject</label>
                <input type="number" value={form.minMarksPerSubject ?? ''} onChange={e=>setForm((p:any)=>({ ...p, minMarksPerSubject: e.target.value===''? undefined : Number(e.target.value) }))} className="w-full border rounded px-3 py-2"/>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowEdit({ open: false, doc: null })} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSubmitEdit} disabled={working==='edit'} className="px-4 py-2 rounded bg-blue-600 text-white">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminExamResults


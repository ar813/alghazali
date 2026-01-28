"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { Calendar, Plus, Save, Trash2, Upload, Download, X, Edit2, Loader2, Search, Info, FileSpreadsheet, Copy } from 'lucide-react'
import { toast } from "sonner";

// Types
type ScheduleDay = { day: string; periods: { subject: string; time: string }[] }
type ScheduleDoc = { _id: string; className: string; days: ScheduleDay[] }

const AdminSchedule = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [schedules, setSchedules] = useState<ScheduleDoc[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState<boolean>(false)

  // Form state
  const classOptions = ['1', '2', '3', '4', '5', '6', 'SSCI', 'SSCII']
  const dayOptions = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const subjectOptions = ['English', 'Urdu', 'Math', 'Science', 'Islamiat', 'Computer', 'Nardban', 'Nazra', 'Islamiat', 'Social Studies', 'Talim-ul-Islam', 'General Knowledge', 'Islami Adaab', 'Rasool Arabi', 'English Grammar', 'Chemistry', 'Biology', "Physics", "Pak Studies", "Break Time"]
  const timeOptions = ['08:00 - 08:35', '08:35 - 09:10', '09:10 - 09:45', '09:45 - 10:20', '10:20 - 10:55', '10:55 - 11:30', '11:30 - 12:00', '12:00 - 12:35', '12:45 - 01:20', '01:35 - 02:10']

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
  // Delete confirm state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; className: string; day: string } | null>(null)
  const [deletingDay, setDeletingDay] = useState<boolean>(false)

  // Import/Export helpers
  const [importLoading, setImportLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [copyingSchedule, setCopyingSchedule] = useState<{ fromClass: string; fromDay: string; periods: any[] } | null>(null)
  const fileInputId = 'schedule-import-input'

  const loadExcel = async () => {
    try {
      const ExcelJS = await import('exceljs')
      return (ExcelJS as any).default || (ExcelJS as any)
    } catch (e) {
      console.error('ExcelJS could not be loaded:', e);
      throw new Error('ExcelJS could not be loaded. Please ensure it is installed.')
    }
  }

  const handleExport = async () => {
    try {
      if (schedules.length === 0) { toast.error('No schedules to export'); return }
      const ExcelJS: any = await loadExcel()
      const fileSaver = await import('file-saver')
      const saveAs = (fileSaver as any).default?.saveAs || (fileSaver as any).saveAs
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Schedules')
      ws.columns = [
        { header: 'Class', key: 'className', width: 10 },
        { header: 'Day', key: 'day', width: 12 },
        { header: 'Subject', key: 'subject', width: 20 },
        { header: 'Time', key: 'time', width: 18 },
      ]
      for (const sc of schedules) {
        for (const d of sc.days || []) {
          for (const p of d.periods || []) {
            ws.addRow({ className: sc.className, day: d.day, subject: p.subject, time: p.time })
          }
        }
      }
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `schedules_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Schedules exported')
    } catch (e: any) {
      toast.error(`Export failed: ${e?.message || 'Unknown error'}`)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS: any = await loadExcel()
      const fileSaver = await import('file-saver')
      const saveAs = (fileSaver as any).default?.saveAs || (fileSaver as any).saveAs
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Template')
      ws.columns = [
        { header: 'Class', key: 'className', width: 10 },
        { header: 'Day', key: 'day', width: 12 },
        { header: 'Subject', key: 'subject', width: 20 },
        { header: 'Time', key: 'time', width: 18 },
      ]
      ws.addRow({ className: '1', day: 'Monday', subject: 'Math', time: '08:00 - 08:35' })
      ws.addRow({ className: '1', day: 'Monday', subject: 'English', time: '08:35 - 09:10' })
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, 'schedule_template.xlsx')
      toast.success('Template downloaded')
    } catch (e: any) {
      toast.error('Failed to download template')
    }
  }

  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase()
    if (s.includes('math')) return 'bg-blue-50 text-blue-600 border-blue-100'
    if (s.includes('eng')) return 'bg-purple-50 text-purple-600 border-purple-100'
    if (s.includes('sci')) return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    if (s.includes('isl')) return 'bg-green-50 text-green-600 border-green-100'
    if (s.includes('urd')) return 'bg-orange-50 text-orange-600 border-orange-100'
    if (s.includes('his') || s.includes('geo')) return 'bg-amber-50 text-amber-600 border-amber-100'
    if (s.includes('phy') || s.includes('spo')) return 'bg-rose-50 text-rose-600 border-rose-100'
    return 'bg-gray-50 text-gray-600 border-gray-100'
  }
  const onClickImport = () => {
    const el = document.getElementById(fileInputId) as HTMLInputElement | null
    el?.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImportLoading(true)
      const ExcelJS: any = await loadExcel()
      const wb = new ExcelJS.Workbook()
      const buf = await file.arrayBuffer()
      await wb.xlsx.load(buf)
      const ws = wb.worksheets[0]
      const rows = ws.getSheetValues()
      type RowType = { className: string; day: string; subject: string; time: string }
      const records: RowType[] = []
      for (let i = 2; i < rows.length; i++) {
        const r: any = rows[i]
        if (!r) continue
        const className = String(r[1] ?? '').trim()
        const day = String(r[2] ?? '').trim()
        const subject = String(r[3] ?? '').trim()
        const time = String(r[4] ?? '').trim()
        if (!className || !day || !subject || !time) continue
        records.push({ className, day, subject, time })
      }
      if (records.length === 0) { toast.error('No valid rows found'); return }
      const byKey: Record<string, { className: string; day: string; periods: { subject: string; time: string }[] }> = {}
      for (const r of records) {
        const key = `${r.className}__${r.day}`
        if (!byKey[key]) byKey[key] = { className: r.className, day: r.day, periods: [] }
        byKey[key].periods.push({ subject: r.subject, time: r.time })
      }
      let saved = 0
      for (const k of Object.keys(byKey)) {
        const rec = byKey[k]
        const res = await fetch('/api/schedule', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className: rec.className, day: rec.day, periods: rec.periods })
        })
        const j = await res.json()
        if (j?.ok) saved++
      }
      await loadSchedules()
      toast.success(`Imported ${saved} day(s)`)
    } catch (e: any) {
      toast.error(`Import failed: ${e?.message || 'Unknown error'}`)
    } finally {
      setImportLoading(false)
      const el = document.getElementById(fileInputId) as HTMLInputElement | null
      if (el) el.value = ''
    }
  }

  const loadSchedules = React.useCallback(async () => {
    try {
      setLoadingSchedules(true)
      onLoadingChange?.(true)
      const res = await fetch('/api/schedule', { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setSchedules(json.data as ScheduleDoc[])
    } catch {
      toast.error('Failed to load schedules')
    }
    finally { setLoadingSchedules(false); onLoadingChange?.(false) }
  }, [onLoadingChange])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

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
      toast.error('Please select class, day and fill all periods')
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
      toast.success('Schedule updated')
    } catch {
      toast.error('Failed to save schedule')
    } finally {
      setEditSubmitting(false)
    }
  }

  const addPeriodRow = () => setFormPeriods(prev => [...prev, { subject: '', time: '' }])
  const removePeriodRow = (idx: number) => setFormPeriods(prev => prev.filter((_, i) => i !== idx))
  const updatePeriod = (idx: number, key: 'subject' | 'time', value: string) =>
    setFormPeriods(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))

  const submitSchedule = async () => {
    if (!formClass || !formDay || formPeriods.some(p => !p.subject || !p.time)) {
      toast.error('Please select class, day and fill all periods')
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
      toast.success('Schedule saved')
    } catch {
      toast.error('Failed to save schedule')
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
      toast.success('Deleted successfully')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete')
    }
  }

  const deleteFullClassSchedule = async (className: string) => {
    if (!confirm(`Are you sure you want to delete the ENTIRE schedule for Class ${className}?`)) return
    try {
      setLoadingSchedules(true)
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteFullClass', className })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to delete class schedule')
      await loadSchedules()
      toast.success(`Class ${className} schedule cleared`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete')
    } finally {
      setLoadingSchedules(false)
    }
  }

  const handlePasteSchedule = async (targetClass: string, targetDay: string) => {
    if (!copyingSchedule) return
    try {
      setLoadingSchedules(true)
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: targetClass,
          day: targetDay,
          periods: copyingSchedule.periods
        })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to paste schedule')
      await loadSchedules()
      toast.success(`Copied from ${copyingSchedule.fromDay} to ${targetDay}`)
      setCopyingSchedule(null)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to paste')
    } finally {
      setLoadingSchedules(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <input id={fileInputId} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Class Schedule</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <Info size={14} className="text-blue-500" />
            Manage and organize class timings and weekly timetables efficiently.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:min-w-[240px] sm:w-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={handleDownloadTemplate} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all shadow-sm">
              <FileSpreadsheet size={16} /> <span className="hidden xs:inline">Template</span><span className="xs:hidden">Template</span>
            </button>
            <button onClick={handleExport} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
              <Upload size={16} /> <span className="hidden xs:inline">Export</span><span className="xs:hidden">Export</span>
            </button>
            <button onClick={onClickImport} disabled={importLoading} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
              <Download size={16} /> {importLoading ? '...' : <><span className="hidden xs:inline">Import</span><span className="xs:hidden">Import</span></>}
            </button>
          </div>
        </div>
      </div>

      {/* Manage Schedule Section */}
      <div id="manage-schedule" className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Add or Update Day</h3>
              <p className="text-xs text-gray-500">Specify class, day, and periods to update.</p>
            </div>
          </div>
          <button
            onClick={submitSchedule}
            disabled={formSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-60"
          >
            {formSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {formSubmitting ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 px-1">Class</label>
              <select value={formClass} onChange={e => setFormClass(e.target.value)} className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                <option value="">Select Class</option>
                {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 px-1">Day</label>
              <select value={formDay} onChange={e => setFormDay(e.target.value)} className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                <option value="">Select Day</option>
                {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Schedule Periods</h4>
              <button onClick={addPeriodRow} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">
                <Plus size={14} /> Add Period
              </button>
            </div>

            <div className="space-y-3">
              {formPeriods.map((p, idx) => {
                const colorClasses = getSubjectColor(p.subject)
                return (
                  <div key={idx} className="group relative flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-end bg-gray-50/50 p-4 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                    <div className="hidden sm:flex sm:col-span-1 items-center justify-center font-black text-gray-300 group-hover:text-gray-400">
                      {idx + 1}
                    </div>
                    <div className="sm:col-span-5 space-y-1.5">
                      <div className="flex items-center justify-between sm:block">
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Subject</label>
                        <span className="sm:hidden text-[10px] font-black text-gray-300">#{idx + 1}</span>
                      </div>
                      <select value={p.subject} onChange={e => updatePeriod(idx, 'subject', e.target.value)} className={`w-full bg-white border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black ${colorClasses}`}>
                        <option value="">Select Subject</option>
                        {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Time Slot</label>
                      <select value={p.time} onChange={e => updatePeriod(idx, 'time', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                        <option value="">Select Time</option>
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button onClick={() => removePeriodRow(idx)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2 sm:block border sm:border-0 border-gray-100" title="Remove">
                        <Trash2 size={18} />
                        <span className="sm:hidden text-xs font-bold">Remove Period</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {formPeriods.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-400 text-sm">No periods added. Click 'Add Period' to start.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Calendar size={18} />
            </span>
            <h2 className="text-xl font-bold text-gray-900">Current Timetables</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {schedules.length} Classes Active
          </div>
        </div>

        {loadingSchedules ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[400px] rounded-3xl border border-gray-100 bg-white p-6 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-100 rounded" />
                    <div className="h-3 w-16 bg-gray-50 rounded" />
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  {[...Array(4)].map((__, j) => <div key={j} className="h-20 bg-gray-50/50 rounded-2xl border border-gray-50" />)}
                </div>
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Calendar size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No schedules found</h3>
            <p className="text-gray-500 mb-6">Start by adding a class schedule using the form above.</p>
            <button
              onClick={() => document.getElementById('manage-schedule')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-all shadow-sm"
            >
              Add Your First Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules
              .filter(sc => sc.className.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(sc => (
                <div key={sc._id} className="group flex flex-col bg-white rounded-3xl border border-gray-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
                  <div className="p-6 pb-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-black text-base xs:text-lg shadow-lg shadow-zinc-200 shrink-0">
                          {sc.className}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-gray-900 text-base xs:text-lg truncate">Class {sc.className}</h4>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mt-1">
                            {sc.days?.length || 0} Scheduled Days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteFullClassSchedule(sc.className)}
                          className="p-2.5 rounded-xl bg-white border border-red-50 text-red-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                          title="Delete Entire Class"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => openEditModalForClass(sc.className)}
                          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all"
                          title="Add Day"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar bg-white">
                    {sc.days?.map(day => (
                      <div key={day.day} className="relative bg-gray-50/50 rounded-2xl border border-gray-100 p-4 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group/day">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                            <span className="font-black text-gray-900 text-sm tracking-tight">{day.day}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/day:opacity-100 transition-opacity">
                            {copyingSchedule && copyingSchedule.fromClass === sc.className && copyingSchedule.fromDay === day.day ? (
                              <button
                                className="p-1.5 text-blue-600 bg-blue-50 rounded-lg transition-all border border-blue-200 animate-pulse"
                                onClick={() => setCopyingSchedule(null)}
                                title="Cancel Copy"
                              >
                                <X size={14} />
                              </button>
                            ) : copyingSchedule ? (
                              <button
                                className="p-1.5 text-blue-600 bg-blue-50 rounded-lg transition-all border border-blue-200 animate-pulse"
                                onClick={() => handlePasteSchedule(sc.className, day.day)}
                                title="Paste Here"
                              >
                                <Save size={14} />
                              </button>
                            ) : (
                              <button
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                onClick={() => setCopyingSchedule({ fromClass: sc.className, fromDay: day.day, periods: day.periods })}
                                title="Copy Schedule"
                              >
                                <Copy size={14} />
                              </button>
                            )}
                            <button
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              onClick={() => openEditModalForDay(sc.className, day.day, day.periods)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              onClick={() => setConfirmDelete({ open: true, className: sc.className, day: day.day })}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {day.periods?.map((p, idx) => {
                            const colorClasses = getSubjectColor(p.subject)
                            return (
                              <div key={idx} className={`flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors group/period`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-gray-300 w-4">{idx + 1}</span>
                                  <span className={`px-2 py-1 rounded-lg text-[11px] font-black border ${colorClasses}`}>
                                    {p.subject}
                                  </span>
                                </div>
                                <span className="px-2 py-1 bg-zinc-50 border border-zinc-100 text-zinc-500 font-bold text-[10px] rounded-lg tracking-tight">
                                  {p.time}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {(!sc.days || sc.days.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <Calendar size={32} />
                        <p className="text-xs font-bold mt-2 uppercase tracking-widest">No Days Set</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Schedule</h3>
                  <p className="text-xs text-gray-500">Updating Class {editClass} • {editDay || 'New Day'}</p>
                </div>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Class</label>
                  <select value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                    <option value="">Select Class</option>
                    {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Day</label>
                  <select value={editDay} onChange={e => setEditDay(e.target.value)} className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                    <option value="">Select Day</option>
                    {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedule Periods</h4>
                  <button onClick={addEditPeriodRow} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all">
                    <Plus size={14} /> Add Period
                  </button>
                </div>

                <div className="space-y-3">
                  {editPeriods.map((p, idx) => {
                    const colorClasses = getSubjectColor(p.subject)
                    return (
                      <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:border-blue-200 shadow-sm">
                        <div className="hidden sm:flex sm:col-span-1 items-center justify-center font-black text-gray-200">
                          {idx + 1}
                        </div>
                        <div className="sm:col-span-10 flex flex-col sm:grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between sm:block">
                              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Subject</label>
                              <span className="sm:hidden text-[10px] font-black text-gray-300">#{idx + 1}</span>
                            </div>
                            <select
                              value={p.subject}
                              onChange={e => updateEditPeriod(idx, 'subject', e.target.value)}
                              className={`w-full bg-white border border-gray-100 rounded-xl p-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all ${colorClasses}`}
                            >
                              <option value="">Select Subject</option>
                              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-1">Time Slot</label>
                            <select value={p.time} onChange={e => updateEditPeriod(idx, 'time', e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                              <option value="">Select Time</option>
                              {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <button onClick={() => removeEditPeriodRow(idx)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2 border sm:border-0 border-gray-100">
                            <Trash2 size={18} />
                            <span className="sm:hidden text-xs font-bold">Remove</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitEditSchedule}
                disabled={editSubmitting}
                className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-60"
              >
                {editSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete?.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Trash2 size={32} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Delete Schedule?</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Are you sure you want to remove the schedule for
                <span className="block font-bold text-gray-900 mt-1 whitespace-nowrap">Class {confirmDelete.className} • {confirmDelete.day}</span>
              </p>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex gap-3">
              <button
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
                onClick={() => setConfirmDelete(null)}
              >
                Keep it
              </button>
              <button
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-60"
                disabled={deletingDay}
                onClick={async () => {
                  if (!confirmDelete) return
                  const { className, day } = confirmDelete
                  try {
                    setDeletingDay(true)
                    await deleteScheduleDay(className, day)
                  } finally {
                    setDeletingDay(false)
                    setConfirmDelete(null)
                  }
                }}
              >
                {deletingDay ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminSchedule

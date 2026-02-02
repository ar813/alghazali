"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Plus, Save, Trash2, Upload, Download, Search, FileSpreadsheet, Loader2, AlertTriangle, ListFilter } from 'lucide-react'
import { toast } from "sonner";
import ScheduleCard from './ScheduleCard';
import { useSession } from '@/context/SessionContext';
import { ScheduleDoc } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const AdminSchedule = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const { selectedSession } = useSession();
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
    } catch (_e) {
      console.error('ExcelJS could not be loaded:', _e);
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
    } catch (_e: any) {
      toast.error(`Export failed: ${_e?.message || 'Unknown error'}`)
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
    } catch {
      toast.error('Failed to download template')
    }
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
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className: rec.className, day: rec.day, periods: rec.periods, session: selectedSession })
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
      if (!selectedSession) return;
      setLoadingSchedules(true)
      onLoadingChange?.(true)
      const res = await fetch(`/api/schedule?session=${selectedSession}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setSchedules(json.data as ScheduleDoc[])
    } catch {
      toast.error('Failed to load schedules')
    }
    finally { setLoadingSchedules(false); onLoadingChange?.(false) }
  }, [onLoadingChange, selectedSession])

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
        body: JSON.stringify({ className: editClass, day: editDay, periods: editPeriods, session: selectedSession })
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
        body: JSON.stringify({ className: formClass, day: formDay, periods: formPeriods, session: selectedSession })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to save schedule')

      // Reset form but keeping class might be useful, but let's reset to be clean
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
      const url = `/api/schedule?className=${encodeURIComponent(className)}&day=${encodeURIComponent(day)}&session=${encodeURIComponent(selectedSession || '')}`
      let res = await fetch(url, { method: 'DELETE' })
      // Fallback: if server doesn't support DELETE, try POST with action
      if (!res.ok) {
        res = await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', className, day, session: selectedSession })
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
        body: JSON.stringify({ action: 'deleteFullClass', className, session: selectedSession })
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
          periods: copyingSchedule.periods,
          session: selectedSession
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

  // Memoized derived state
  const filteredSchedules = useMemo(() =>
    schedules.filter(sc => sc.className.toLowerCase().includes(searchTerm.toLowerCase())),
    [schedules, searchTerm]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <input id={fileInputId} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Class Schedule</h1>
          <p className="text-zinc-500 text-sm flex items-center gap-2 font-medium max-w-lg">
            Manage academic calendars and weekly timetables. Import from Excel or configure manually.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:min-w-[240px] sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Filter classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all outline-none font-medium placeholder:text-zinc-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={handleDownloadTemplate} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <FileSpreadsheet size={16} /> <span>Template</span>
            </button>
            <button onClick={handleExport} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <Upload size={16} /> <span>Export</span>
            </button>
            <button onClick={onClickImport} disabled={importLoading} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all disabled:opacity-50">
              <Download size={16} /> {importLoading ? '...' : <span>Import</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Section */}
      <div id="manage-schedule" className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl overflow-hidden mb-12">
        <div className="px-6 py-5 border-b border-zinc-100/50 dark:border-zinc-800/50 flex items-center justify-between bg-white/40 dark:bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-zinc-900 shrink-0 shadow-lg shadow-zinc-900/10 dark:shadow-white/5">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight uppercase tracking-tight">Schedule Editor</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Configure Academic Timetable</p>
            </div>
          </div>
          <button
            onClick={submitSchedule}
            disabled={formSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
          >
            {formSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {formSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Class</label>
              <select value={formClass} onChange={e => setFormClass(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all outline-none">
                <option value="">Select Class</option>
                {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Day</label>
              <select value={formDay} onChange={e => setFormDay(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all outline-none">
                <option value="">Select Day</option>
                {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Periods</h4>
              <button onClick={addPeriodRow} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
                <Plus size={14} /> Add Slot
              </button>
            </div>

            <div className="space-y-3">
              {formPeriods.map((p, idx) => (
                <div key={idx} className="group relative flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-end bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-all">
                  <div className="hidden sm:flex sm:col-span-1 items-center justify-center font-mono text-zinc-300 dark:text-zinc-700 text-sm">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="sm:col-span-6 space-y-1.5">
                    <div className="flex items-center justify-between sm:block">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-1">Subject</label>
                      <span className="sm:hidden text-[10px] font-mono text-zinc-300">#{idx + 1}</span>
                    </div>
                    <select value={p.subject} onChange={e => updatePeriod(idx, 'subject', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium">
                      <option value="">Select Subject</option>
                      {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-1">Time</label>
                    <select value={p.time} onChange={e => updatePeriod(idx, 'time', e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all font-mono">
                      <option value="">Select Time</option>
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button onClick={() => removePeriodRow(idx)} className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2 sm:block" title="Remove">
                      <Trash2 size={16} />
                      <span className="sm:hidden text-xs font-bold">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {formPeriods.length === 0 && (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-zinc-400 text-sm">No periods added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Active Timetables</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {schedules.length} CLASSES
          </div>
        </div>

        {loadingSchedules ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="relative mb-4">
              <div className="w-10 h-10 border-4 border-indigo-50 dark:border-indigo-900/30 rounded-full"></div>
              <div className="absolute inset-0 w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest animate-pulse">Loading Schedules...</h3>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={24} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No schedules found</h3>
            <p className="text-zinc-500 mb-6 max-w-xs mx-auto">Either import schedules from Excel or add them manually using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.map(sc => (
              <ScheduleCard
                key={sc._id}
                schedule={sc}
                copyingSchedule={copyingSchedule}
                onDeleteClass={deleteFullClassSchedule}
                onAddDay={openEditModalForClass}
                onEditDay={openEditModalForDay}
                onDeleteDay={deleteScheduleDay}
                onCopySchedule={(cls, day, periods) => setCopyingSchedule({ fromClass: cls, fromDay: day, periods })}
                onPasteSchedule={handlePasteSchedule}
                onCancelCopy={() => setCopyingSchedule(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-md flex flex-col max-h-[95vh] sm:max-h-[85vh]">
          <DialogHeader className="px-4 py-3 sm:px-6 sm:py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 dark:bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-white dark:text-zinc-900 shadow-sm shrink-0">
                <Calendar size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white leading-tight">Edit Schedule</DialogTitle>
                <DialogDescription className="text-[10px] sm:text-sm text-zinc-500 font-medium leading-none mt-0.5 sm:mt-1">
                  Class {editClass} • {editDay || 'New Day'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-5 sm:mb-8">
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Class</label>
                <select
                  value={editClass}
                  onChange={e => setEditClass(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 sm:p-3 text-xs sm:text-sm font-medium outline-none focus:ring-1 focus:ring-zinc-900 transition-all cursor-pointer"
                >
                  <option value="">Select Class</option>
                  {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Day</label>
                <select
                  value={editDay}
                  onChange={e => setEditDay(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 sm:p-3 text-xs sm:text-sm font-medium outline-none focus:ring-1 focus:ring-zinc-900 transition-all cursor-pointer"
                >
                  <option value="">Select Day</option>
                  {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ListFilter size={12} className="text-zinc-400 sm:w-[14px] sm:h-[14px]" />
                  <h4 className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Periods Configuration</h4>
                </div>
                <button
                  onClick={addEditPeriodRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={12} className="sm:w-[14px] sm:h-[14px]" /> Add Slot
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {editPeriods.map((p, idx) => (
                  <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-stretch sm:items-center bg-zinc-50 dark:bg-zinc-900/30 p-2.5 sm:p-4 rounded-md border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-900 shadow-sm sm:shadow-none">
                    <div className="hidden sm:flex sm:col-span-1 items-center justify-center font-mono text-zinc-300 dark:text-zinc-700 text-[10px]">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="sm:col-span-10 grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-0.5">
                        <label className="sm:hidden text-[8px] font-bold text-zinc-400 uppercase px-1 leading-none mb-1 inline-block">Subject</label>
                        <select
                          value={p.subject}
                          onChange={e => updateEditPeriod(idx, 'subject', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-1.5 sm:p-2.5 text-[10px] sm:text-xs font-medium outline-none focus:ring-1 focus:ring-zinc-900 h-8 sm:h-auto"
                        >
                          <option value="">Subject</option>
                          {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <label className="sm:hidden text-[8px] font-bold text-zinc-400 uppercase px-1 leading-none mb-1 inline-block">Time</label>
                        <select
                          value={p.time}
                          onChange={e => updateEditPeriod(idx, 'time', e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-1.5 sm:p-2.5 text-[10px] sm:text-xs font-mono outline-none focus:ring-1 focus:ring-zinc-900 h-8 sm:h-auto"
                        >
                          <option value="">Time</option>
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeEditPeriodRow(idx)}
                        className="p-1.5 sm:p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all sm:w-auto h-8 sm:h-auto flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        <span className="sm:hidden text-[10px] font-bold">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-row items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all active:scale-95"
            >
              Discard
            </button>
            <button
              onClick={submitEditSchedule}
              disabled={editSubmitting}
              className="flex-[2] sm:flex-none px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-md hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              {editSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editSubmitting ? 'Saving' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={confirmDelete?.open}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-md">
          <AlertDialogHeader className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertTriangle size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-base leading-relaxed px-4">
              This will permanently delete the schedule for <span className="font-bold text-zinc-900 dark:text-zinc-100">Class {confirmDelete?.className}</span> on <span className="font-bold text-zinc-900 dark:text-zinc-100">{confirmDelete?.day}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-8 pt-6 flex flex-col sm:flex-row gap-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-md font-bold text-zinc-600 hover:bg-zinc-100 border-none transition-all active:scale-95">
              Keep Schedule
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-12 rounded-md font-bold bg-red-600 hover:bg-red-700 text-white border-none transition-all active:scale-95 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              disabled={deletingDay}
              onClick={async (e) => {
                e.preventDefault()
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
              {deletingDay ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {deletingDay ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

export default AdminSchedule

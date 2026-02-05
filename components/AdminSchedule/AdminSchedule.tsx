"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { Calendar, Plus, Save, Trash2, Upload, Download, Search, FileSpreadsheet, Loader2, AlertTriangle, ListFilter } from 'lucide-react'
import { toast } from "sonner";
import ScheduleCard from './ScheduleCard';
import { useSession } from '@/context/SessionContext';
import { ScheduleDoc } from './types';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from "@chakra-ui/react"
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
  const dayOptions = ['Whole Week', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const subjectOptions = ['English', 'Urdu', 'Math', 'Science', 'Islamiat', 'Computer', 'Nardban', 'Nazra', 'Islamiat', 'Social Studies', 'Talim-ul-Islam', 'General Knowledge', 'Islami Adaab', 'Rasool Arabi', 'English Grammar', 'Chemistry', 'Biology', "Physics", "Pak Studies", "Break Time"]
  const timeOptions = ['08:00 - 08:35', '08:35 - 09:10', '09:10 - 09:45', '09:45 - 10:20', '10:20 - 10:55', '10:55 - 11:30', '11:30 - 12:00', '12:00 - 12:35', '12:45 - 01:20', '01:35 - 02:10']

  const { isOpen: isDrawerOpen, onOpen: onOpenDrawer, onClose: onCloseDrawer } = useDisclosure()
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')
  const [editClass, setEditClass] = useState<string>('')
  const [editDay, setEditDay] = useState<string>('')
  const [editPeriods, setEditPeriods] = useState<{ subject: string; time: string }[]>([{ subject: '', time: '' }])
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false)

  // Delete confirm state
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; type: 'day' | 'class'; className: string; day?: string } | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

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
  // Helpers for Drawer
  const openAddDrawer = () => {
    setDrawerMode('add')
    setEditClass('')
    setEditDay('')
    setEditPeriods([{ subject: '', time: '' }])
    onOpenDrawer()
  }

  const openEditModalForClass = (className: string) => {
    setDrawerMode('edit')
    setEditClass(className)
    setEditDay('')
    setEditPeriods([{ subject: '', time: '' }])
    onOpenDrawer()
  }

  const openEditModalForDay = (className: string, dayName: string, periods?: { subject: string; time: string }[]) => {
    setDrawerMode('edit')
    setEditClass(className)
    setEditDay(dayName)
    setEditPeriods(periods?.length ? periods : [{ subject: '', time: '' }])
    onOpenDrawer()
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
      onCloseDrawer()
      await loadSchedules()
      toast.success(drawerMode === 'add' ? 'Schedule saved' : 'Schedule updated')
    } catch {
      toast.error('Failed to save schedule')
    } finally {
      setEditSubmitting(false)
    }
  }


  const deleteScheduleDay = async (className: string, day: string) => {
    try {
      setDeleting(true)
      const url = `/api/schedule?className=${encodeURIComponent(className)}&day=${encodeURIComponent(day)}&session=${encodeURIComponent(selectedSession || '')}`
      let res = await fetch(url, { method: 'DELETE' })
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
      toast.success(`${day} schedule deleted`)
      setConfirmDelete(null)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const deleteFullClassSchedule = async (className: string) => {
    try {
      setDeleting(true)
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteFullClass', className, session: selectedSession })
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to delete class schedule')
      await loadSchedules()
      toast.success(`Class ${className} schedule cleared`)
      setConfirmDelete(null)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete')
    } finally {
      setDeleting(false)
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
            <button
              onClick={openAddDrawer}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
            >
              <Plus size={16} /> <span>Add Schedule</span>
            </button>
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
                onDeleteClass={(cls) => setConfirmDelete({ open: true, type: 'class', className: cls })}
                onAddDay={openEditModalForClass}
                onEditDay={openEditModalForDay}
                onDeleteDay={(cls, day) => setConfirmDelete({ open: true, type: 'day', className: cls, day })}
                onCopySchedule={(cls, day, periods) => setCopyingSchedule({ fromClass: cls, fromDay: day, periods })}
                onPasteSchedule={handlePasteSchedule}
                onCancelCopy={() => setCopyingSchedule(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Schedule Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        onClose={onCloseDrawer}
        size="md"
      >
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent className="dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
          <DrawerCloseButton className="top-4 right-4" />
          <DrawerHeader className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-zinc-900 shadow-sm shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                  {drawerMode === 'add' ? 'Add New Schedule' : 'Edit Schedule'}
                </h2>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  {drawerMode === 'add' ? 'Configure a new academic timetable' : `Class ${editClass} • ${editDay || 'Untitled'}`}
                </p>
              </div>
            </div>
          </DrawerHeader>

          <DrawerBody className="px-6 py-8 custom-scrollbar">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Class</label>
                  <select
                    value={editClass}
                    onChange={e => setEditClass(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                  >
                    <option value="">Select Class</option>
                    {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Day</label>
                  <select
                    value={editDay}
                    onChange={e => setEditDay(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                  >
                    <option value="">Select Day</option>
                    {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ListFilter size={14} className="text-zinc-400" />
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Periods Configuration</h4>
                  </div>
                  <button
                    onClick={addEditPeriodRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    <Plus size={14} /> Add Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {editPeriods.map((p, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-900 group">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">SLOT #{(idx + 1).toString().padStart(2, '0')}</span>
                        <button
                          onClick={() => removeEditPeriodRow(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all sm:opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-400 uppercase px-1">Subject</label>
                          <select
                            value={p.subject}
                            onChange={e => updateEditPeriod(idx, 'subject', e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                          >
                            <option value="">Subject</option>
                            {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-zinc-400 uppercase px-1">Time</label>
                          <select
                            value={p.time}
                            onChange={e => updateEditPeriod(idx, 'time', e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                          >
                            <option value="">Time</option>
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex items-center gap-3">
            <button
              onClick={onCloseDrawer}
              className="flex-1 px-4 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={submitEditSchedule}
              disabled={editSubmitting}
              className="flex-[1.5] px-6 py-3 text-sm font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
            >
              {editSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {editSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={confirmDelete?.open}
        onOpenChange={(open) => !open && !deleting && setConfirmDelete(null)}
      >
        <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl dark:bg-zinc-950">
          <AlertDialogHeader className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-in zoom-in duration-300">
              <AlertTriangle size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed px-4">
              {confirmDelete?.type === 'class' ? (
                <>This will permanently delete the <span className="font-bold text-zinc-900 dark:text-zinc-100">ENTIRE schedule</span> for <span className="font-bold text-zinc-900 dark:text-zinc-100">Class {confirmDelete.className}</span>.</>
              ) : (
                <>This will permanently delete the schedule for <span className="font-bold text-zinc-900 dark:text-zinc-100">Class {confirmDelete?.className}</span> on <span className="font-bold text-zinc-900 dark:text-zinc-100">{confirmDelete?.day}</span>.</>
              )}
              <div className="mt-2 text-red-500 font-bold text-xs uppercase tracking-widest">This action cannot be undone.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-8 pt-6 flex flex-col sm:flex-row gap-4">
            <AlertDialogCancel disabled={deleting} className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none transition-all active:scale-95">
              Keep Schedule
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-12 rounded-xl font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-none transition-all active:scale-95 shadow-lg shadow-zinc-900/10 dark:shadow-white/5 flex items-center justify-center gap-2"
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault()
                if (!confirmDelete) return
                const { className, day, type } = confirmDelete
                if (type === 'class') {
                  await deleteFullClassSchedule(className)
                } else if (day) {
                  await deleteScheduleDay(className, day)
                }
              }}
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

export default AdminSchedule

"use client"

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import type { Student } from '@/types/student'
import type { FeeStatus } from '@/types/fees'
import { toast } from "sonner";
import FeeToolbar from './FeeToolbar';
import FeeTable from './FeeTable';
import FeeDrawer from './FeeDrawer';
import FeeDetails from './FeeDetails';
import { useAuth } from '@/hooks/use-auth';

const MONTHS = ['Month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'admission'] as const

import { useSession } from '@/context/SessionContext';

const AdminFees = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Filters
  const [filterClass, setFilterClass] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterYear, setFilterYear] = useState<number | ''>(new Date().getFullYear())
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [search, setSearch] = useState('')

  const { selectedSession } = useSession();
  const { user } = useAuth();

  // Modal & Selection state
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState<any | null>(null)
  const [detailFee, setDetailFee] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Load students
  useEffect(() => {
    if (!selectedSession) return;
    const load = async () => {
      setLoading(true); onLoadingChange?.(true)
      try {
        const s: Student[] = await client.fetch(getAllStudentsQuery, { session: selectedSession })
        setStudents(s)
      } finally {
        setLoading(false); onLoadingChange?.(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession])

  // Actions
  const loadFees = useCallback(async () => {
    if (!selectedSession || !user) return;
    setLoading(true); onLoadingChange?.(true)
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams()
      if (filterClass) params.set('className', filterClass)
      if (filterMonth && filterMonth !== 'Month') params.set('month', filterMonth)
      if (filterYear) params.set('year', String(filterYear))
      if (filterStatus) params.set('status', filterStatus)
      if (search.trim()) params.set('q', search.trim())
      params.set('session', selectedSession)

      const res = await fetch(`/api/fees?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })
      const json = await res.json()
      if (json?.ok) setFees(json.data)
    } catch (e) {
      console.error('Failed to load fees', e)
      toast.error('Failed to load fees')
    } finally { setLoading(false); onLoadingChange?.(false) }
  }, [selectedSession, user, filterClass, filterMonth, filterYear, filterStatus, search, onLoadingChange])

  const handleExportFees = async () => {
    try {
      if (fees.length === 0) {
        toast.error('No fees to export!')
        return
      }
      const ExcelJS = await import('exceljs').then(m => m.default || m)
      const fileSaver = await import('file-saver').then(m => m.default || m)
      const saveAs = fileSaver.saveAs || fileSaver

      const wb = new (ExcelJS as any).Workbook()
      const ws = wb.addWorksheet('Fees')
      ws.columns = [
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'GR Number', key: 'grNumber', width: 15 },
        { header: 'Roll No', key: 'rollNumber', width: 12 },
        { header: 'Class', key: 'className', width: 10 },
        { header: 'Month', key: 'month', width: 14 },
        { header: 'Year', key: 'year', width: 8 },
        { header: 'Amount Paid', key: 'amountPaid', width: 12 },
        { header: 'Paid Date', key: 'paidDate', width: 12 },
        { header: 'Receipt Number', key: 'receiptNumber', width: 16 },
        { header: 'Book Number', key: 'bookNumber', width: 14 },
        { header: 'Notes', key: 'notes', width: 30 },
      ]
      fees.forEach((f: any) => {
        ws.addRow({
          studentName: f.student?.fullName || '',
          grNumber: f.student?.grNumber || '',
          rollNumber: f.student?.rollNumber || '',
          className: f.className || f.student?.admissionFor || '',
          month: (f.feeType === 'admission') ? 'admission' : (f.month || ''),
          year: f.year || '',
          amountPaid: f.amountPaid ?? 0,
          paidDate: f.paidDate || '',
          receiptNumber: f.receiptNumber || '',
          bookNumber: f.bookNumber || '',
          notes: f.notes || '',
        })
      })
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `fees_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (_error: any) {
      console.error('Export error:', _error)
      toast.error('Failed to export')
    }
  }

  const feesFileInputId = 'fees-import-input'
  const handleImportClick = () => document.getElementById(feesFileInputId)?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImportLoading(true)
      const token = await user?.getIdToken();
      const ExcelJS = await import('exceljs').then(m => m.default || m)
      const wb = new (ExcelJS as any).Workbook()
      const buf = await file.arrayBuffer()
      await wb.xlsx.load(buf)
      const ws = wb.worksheets[0]
      const rows = ws.getSheetValues()
      const toCreate: any[] = []

      for (let i = 2; i < rows.length; i++) {
        const r: any = rows[i]
        if (!r) continue
        const gr = (r[2] ?? '').toString().trim()
        const roll = (r[3] ?? '').toString().trim()
        const month = (r[5] ?? '').toString().trim()
        const yearRaw = r[6]
        const amountPaid = Number(r[8] ?? 0)
        const student = students.find(s => (s.grNumber?.toString().trim() === gr) || (s.rollNumber?.toString().trim() === roll))
        if (!student) continue

        toCreate.push({
          studentId: student._id,
          month: month.toLowerCase() === 'admission' ? 'admission' : month,
          year: typeof yearRaw === 'number' ? yearRaw : Number(yearRaw),
          amountPaid: isNaN(amountPaid) ? 0 : amountPaid,
          receiptNumber: (r[10] ?? '').toString().trim() || undefined,
          feeType: month.toLowerCase() === 'admission' ? 'admission' : 'monthly',
        })
      }

      for (const doc of toCreate) {
        await fetch('/api/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(doc)
        })
      }
      await loadFees()
      toast.success(`Import complete`)
    } catch {
      toast.error('Import failed')
    } finally {
      setImportLoading(false)
      const inputEl = document.getElementById(feesFileInputId) as HTMLInputElement | null
      if (inputEl) inputEl.value = ''
    }
  }

  const deleteFee = async (id: string) => {
    toast("Delete Fee Record?", {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm Delete",
        onClick: async () => {
          setDeletingId(id)
          try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/fees?id=${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const json = await res.json()
            if (json?.ok) { await loadFees(); toast.success('Fee record deleted successfully') }
          } catch {
            toast.error('Failed to delete fee record')
          } finally { setDeletingId(null) }
        },
      },
    })
  }

  const markStatus = async (id: string, status: FeeStatus) => {
    setUpdatingStatusId(id)
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/fees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, patch: { status } })
      })
      const json = await res.json()
      if (json?.ok) { await loadFees(); toast.success('Status Updated') }
    } catch { toast.error('Update failed') }
    finally { setUpdatingStatusId(null) }
  }

  const handleSubmitFee = async (formData: any) => {
    setSubmitting(true)
    try {
      const token = await user?.getIdToken();
      const method = editingFee ? 'PATCH' : 'POST'
      const payload = editingFee ? { id: editingFee._id, patch: formData } : formData
      const res = await fetch('/api/fees', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json?.ok) { setShowModal(false); await loadFees(); toast.success('Saved') }
    } finally { setSubmitting(false) }
  }

  // Reload on filter change or initial session load
  useEffect(() => {
    if (selectedSession && user) loadFees()
  }, [selectedSession, user, filterClass, filterMonth, filterYear, filterStatus, loadFees]) // Added deps

  useEffect(() => {
    const t = setTimeout(() => {
      if (selectedSession && user) loadFees()
    }, 400)
    return () => clearTimeout(t)
  }, [search, selectedSession, user, loadFees])

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort(), [students])

  return (
    <div className="w-full max-w-full overflow-hidden px-1 sm:px-0">
      <input id={feesFileInputId} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />

      <div className="flex flex-col gap-4 w-full">
        <FeeToolbar
          filterClass={filterClass} onFilterClassChange={setFilterClass}
          filterMonth={filterMonth} onFilterMonthChange={setFilterMonth}
          filterYear={filterYear} onFilterYearChange={setFilterYear}
          filterStatus={filterStatus} onFilterStatusChange={setFilterStatus}
          search={search} onSearchChange={setSearch}
          uniqueClasses={uniqueClasses} months={MONTHS}
          onRefresh={loadFees} onExport={handleExportFees}
          onImportClick={handleImportClick} onDeleteAll={() => { }}
          onAddFee={() => { setEditingFee(null); setShowModal(true); }}
          loading={loading} importLoading={importLoading}
          hasFilters={!!(filterClass || filterMonth || filterYear || filterStatus || search)}
        />

        <FeeTable
          fees={fees} loading={loading}
          onEdit={(fee) => { setEditingFee(fee); setShowModal(true); }}
          onDelete={deleteFee}
          onUpdateStatus={markStatus}
          deletingId={deletingId}
          updatingStatusId={updatingStatusId}
          onViewDetail={setDetailFee}
        />
      </div>

      <FeeDrawer
        isOpen={showModal} onClose={() => setShowModal(false)}
        onSubmit={handleSubmitFee} initialData={editingFee}
        students={students} MONTHS={MONTHS} submitting={submitting}
      />

      {detailFee && <FeeDetails fee={detailFee} onClose={() => setDetailFee(null)} />}
    </div>
  )
}

export default AdminFees

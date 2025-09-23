"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { getAllStudentsQuery } from '@/sanity/lib/queries'
import type { Student } from '@/types/student'
import type { Fee, FeeStatus } from '@/types/fees'
import { Check, Edit, Loader2, Plus, Save, Search, Trash2, X, Upload, Download } from 'lucide-react'

const MONTHS = ['Month','January','February','March','April','May','June','July','August','September','October','November','December','admission'] as const
const STATUSES: FeeStatus[] = ['paid','partial','unpaid']

const AdminFees = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Filters
  const [filterClass, setFilterClass] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterYear, setFilterYear] = useState<number | ''>(new Date().getFullYear())
  // Status filter removed per request
  const [search, setSearch] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ studentId: string; className?: string; month: string; year: number | ''; amountPaid: number | ''; paidDate?: string; receiptNumber?: string; bookNumber?: string; feeType?: 'monthly' | 'admission'; notes?: string }>({
    studentId: '',
    className: '',
    month: MONTHS[new Date().getMonth() + 1],
    year: new Date().getFullYear(),
    amountPaid: 0,
    paidDate: new Date().toISOString().slice(0,10),
    receiptNumber: '',
    bookNumber: '',
    feeType: 'monthly',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [studentQuickFilter, setStudentQuickFilter] = useState<string>('')
  const [detailFee, setDetailFee] = useState<any | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  // Load students (for selection) and initial fees
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Excel helpers (reuse pattern from AdminStudents)
  const loadExcel = async () => {
    try {
      const ExcelJS = await import('exceljs')
      return (ExcelJS as any).default || (ExcelJS as any)
    } catch (error: any) {
      console.error('Failed to load ExcelJS:', error)
      throw new Error('ExcelJS library could not be loaded. Please make sure it is installed.')
    }
  }

  const handleExportFees = async () => {
    try {
      if (fees.length === 0) {
        alert('Koi fees records nahi hain export karne ke liye!')
        return
      }
      const ExcelJS: any = await loadExcel()
      const fileSaver = await import('file-saver')
      const saveAs = (fileSaver as any).default?.saveAs || (fileSaver as any).saveAs

      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Fees')
      ws.columns = [
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'GR Number', key: 'grNumber', width: 15 },
        { header: 'Roll No', key: 'rollNumber', width: 12 },
        { header: 'Class', key: 'className', width: 10 },
        { header: 'Month', key: 'month', width: 14 },
        { header: 'Year', key: 'year', width: 8 },
        { header: 'Fee Type', key: 'feeType', width: 12 },
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
          feeType: f.feeType || '',
          amountPaid: f.amountPaid ?? 0,
          paidDate: f.paidDate || '',
          receiptNumber: f.receiptNumber || '',
          bookNumber: f.bookNumber || '',
          notes: f.notes || '',
        })
      })
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const fileName = `fees_${new Date().toISOString().split('T')[0]}.xlsx`
      if (saveAs && typeof saveAs === 'function') saveAs(blob, fileName)
      else {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error: any) {
      console.error('Excel export error:', error)
      alert(`Excel export mein error: ${error?.message || 'Unknown error'}`)
    }
  }

  const feesFileInputId = 'fees-import-input'
  const handleImportClick = () => {
    document.getElementById(feesFileInputId)?.click()
  }
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const toCreate: any[] = []
      for (let i = 2; i < rows.length; i++) {
        const r: any = rows[i]
        if (!r) continue
        const gr = (r[2] ?? '').toString().trim() // GR Number column
        const roll = (r[3] ?? '').toString().trim() // Roll No column
        const month = (r[5] ?? '').toString().trim()
        const yearRaw = r[6]
        const amountPaid = Number(r[8] ?? 0)
        const paidDate = (r[9] ?? '').toString().trim()
        const receiptNumber = (r[10] ?? '').toString().trim()
        const bookNumber = (r[11] ?? '').toString().trim()
        const notes = (r[12] ?? '').toString().trim()

        if (!gr && !roll) continue
        const student = students.find(s => (s.grNumber?.toString().trim() === gr) || (s.rollNumber?.toString().trim() === roll))
        if (!student) continue

        const normalizedMonth = month.toLowerCase() === 'admission' ? 'admission' : month
        const numericYear = typeof yearRaw === 'number' ? yearRaw : Number((yearRaw ?? '').toString())
        if (!normalizedMonth || !numericYear) continue

        toCreate.push({
          studentId: student._id,
          className: student.admissionFor || undefined,
          month: normalizedMonth,
          year: numericYear,
          amountPaid: isNaN(amountPaid) ? 0 : amountPaid,
          paidDate: paidDate || undefined,
          receiptNumber: receiptNumber || undefined,
          bookNumber: bookNumber || undefined,
          feeType: normalizedMonth === 'admission' ? 'admission' : 'monthly',
          notes: notes || undefined,
        })
      }

      // Sequential POSTs
      let okCount = 0
      for (const doc of toCreate) {
        try {
          const res = await fetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) })
          const json = await res.json()
          if (json?.ok) okCount++
        } catch {}
      }
      await loadFees()
      alert(`${okCount} out of ${toCreate.length} fees imported successfully.`)
    } catch (error: any) {
      console.error('Excel import error:', error)
      alert(`Excel import mein error: ${error?.message || 'Unknown error'}`)
    } finally {
      setImportLoading(false)
      const inputEl = document.getElementById(feesFileInputId) as HTMLInputElement | null
      if (inputEl) inputEl.value = ''
    }
  }

  const loadFees = async () => {
    setLoading(true); onLoadingChange?.(true)
    try {
      const params = new URLSearchParams()
      if (filterClass) params.set('className', filterClass)
      if (filterMonth && filterMonth !== 'Month') params.set('month', filterMonth)
      if (filterYear) params.set('year', String(filterYear))
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/fees?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setFees(json.data)
    } catch (e) {
      console.error('Failed to load fees', e)
      alert('Failed to load fees')
    } finally { setLoading(false); onLoadingChange?.(false) }
  }

  useEffect(() => {
    loadFees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass, filterMonth, filterYear])

  // Live search: fetch when search changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => { loadFees() }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openForCreate = () => {
    setEditingId(null)
    setForm({ studentId: '', className: '', month: MONTHS[new Date().getMonth() + 1], year: new Date().getFullYear(), amountPaid: 0, paidDate: new Date().toISOString().slice(0,10), receiptNumber: '', bookNumber: '', notes: '' })
    setShowModal(true)
  }

  const openForEdit = (fee: any) => {
    setEditingId(fee._id)
    setForm({
      studentId: fee.student?._id || fee.student?._ref || '',
      className: fee.className || '',
      month: fee.month,
      year: fee.year,
      amountPaid: fee.amountPaid ?? 0,
      paidDate: fee.paidDate || new Date().toISOString().slice(0,10),
      receiptNumber: fee.receiptNumber || '',
      bookNumber: fee.bookNumber || '',
      feeType: fee.feeType || 'monthly',
      notes: fee.notes || '',
    })
    setShowModal(true)
  }

  const submitForm = async () => {
    if (!form.studentId || !form.month || !form.year) {
      alert('Student, month and year are required')
      return
    }
    setSubmitting(true)
    try {
      const payload: any = {
        studentId: form.studentId,
        className: form.className || undefined,
        month: form.month,
        year: Number(form.year),
        amountPaid: form.amountPaid === '' ? 0 : Number(form.amountPaid),
        paidDate: form.paidDate || undefined,
        receiptNumber: form.receiptNumber || undefined,
        bookNumber: form.bookNumber || undefined,
        feeType: (form.month === 'admission') ? 'admission' : 'monthly',
        notes: form.notes || undefined,
      }
      let res: Response
      if (editingId) {
        res = await fetch('/api/fees', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, patch: payload })
        })
      } else {
        res = await fetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Failed to save')
      setShowModal(false)
      await loadFees()
    } catch (e: any) {
      console.error('Save fee failed', e)
      alert(e?.message || 'Save failed')
    } finally { setSubmitting(false) }
  }

  const deleteFee = async (id: string) => {
    if (!confirm('Delete this fee record?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/fees?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Delete failed')
      await loadFees()
    } catch (e: any) {
      console.error('Delete fee failed', e)
      alert(e?.message || 'Delete failed')
    } finally { setDeletingId(null) }
  }

  const markStatus = async (id: string, status: FeeStatus) => {
    try {
      const res = await fetch('/api/fees', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, patch: { status } }) })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Update failed')
      await loadFees()
    } catch (e: any) {
      alert(e?.message || 'Update failed')
    }
  }

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.admissionFor).filter(Boolean))).sort(), [students])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-sm text-gray-600">Class</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
              <option value="">All</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Month</label>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
              <option value="">All</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Year</label>
            <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')} className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadFees()} placeholder="Search by Receipt, Book, Roll No, or GR No" className="w-full border rounded-lg p-2 pl-9 text-sm" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 justify-end">
          <button onClick={handleExportFees} className="px-4 py-2 border rounded-lg bg-white hover:bg-indigo-50 text-sm inline-flex items-center gap-2" title="Export fees to Excel"><Download size={14}/> Export</button>
          <button onClick={handleImportClick} disabled={importLoading} className="px-4 py-2 border rounded-lg bg-white hover:bg-indigo-50 text-sm inline-flex items-center gap-2" title="Import fees from Excel">
            <Upload size={14}/> {importLoading ? 'Importing...' : 'Import'}
          </button>
          <input id={feesFileInputId} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
          <button onClick={openForCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm inline-flex items-center gap-2"><Plus size={14}/> Add Fee</button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" size={18}/> Loading...</div>
        ) : fees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No fee records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="p-2">Student</th>
                  <th className="p-2">Roll No</th>
                  <th className="p-2">Class</th>
                  <th className="p-2">Month</th>
                  <th className="p-2">Year</th>
                  <th className="p-2">Paid</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Receipt / Book</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f._id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setDetailFee(f)}>
                    <td className="p-2">
                      <div className="font-medium text-gray-800">{f.student?.fullName || '—'}</div>
                      <div className="text-xs text-gray-500">GR: {f.student?.grNumber || '—'}</div>
                    </td>
                    <td className="p-2">{f.student?.rollNumber || '—'}</td>
                    <td className="p-2">{f.className || f.student?.admissionFor || '—'}</td>
                    <td className="p-2">{f.feeType === 'admission' ? 'admission' : f.month}</td>
                    <td className="p-2">{f.year}</td>
                    <td className="p-2">{Number(f.amountPaid || 0).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${f.status === 'paid' ? 'bg-green-100 text-green-700' : f.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{f.status}</span>
                    </td>
                    <td className="p-2">
                      <div className="text-xs text-gray-700">{f.receiptNumber || '—'}</div>
                      <div className="text-[11px] text-gray-500">Book: {f.bookNumber || '—'}</div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Edit" onClick={(e) => { e.stopPropagation(); openForEdit(f) }}><Edit size={16}/></button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete" onClick={(e) => { e.stopPropagation(); deleteFee(f._id) }} disabled={deletingId === f._id}>
                          {deletingId === f._id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} 
                        </button>
                        {f.status !== 'paid' && (
                          <button className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Mark Paid" onClick={(e) => { e.stopPropagation(); markStatus(f._id, 'paid') }}>
                            <Check size={16}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Fee' : 'Add Fee'}>
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-6 w-full sm:max-w-2xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Fee' : 'Add Fee'}</h3>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setShowModal(false)}><X/></button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <input
                  value={studentQuickFilter}
                  onChange={e => setStudentQuickFilter(e.target.value)}
                  placeholder="Filter by Roll or GR"
                  className="w-full border rounded px-3 py-2 mb-2 text-sm"
                />
                <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value, className: students.find(s => s._id === e.target.value)?.admissionFor || '' })} className="w-full border rounded px-3 py-2">
                  <option value="">Select student</option>
                  {students
                    .filter(s => {
                      const q = studentQuickFilter.trim().toLowerCase()
                      if (!q) return true
                      return (s.rollNumber || '').toLowerCase().includes(q) || (s.grNumber || '').toLowerCase().includes(q)
                    })
                    .map(s => (
                      <option key={s._id} value={s._id}>{s.fullName} — {s.grNumber} — Roll {s.rollNumber}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <input value={form.className || ''} onChange={e => setForm({ ...form, className: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="e.g. 6" />
              </div>
              {/* Fee Type removed per request. We will infer from month selection (admission => admission) */}
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full border rounded px-3 py-2">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value ? Number(e.target.value) : '' as any })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Paid</label>
                <input type="number" value={form.amountPaid} onChange={e => setForm({ ...form, amountPaid: e.target.value === '' ? '' as any : Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paid Date</label>
                <input type="date" value={form.paidDate || ''} onChange={e => setForm({ ...form, paidDate: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt Number</label>
                <input value={form.receiptNumber || ''} onChange={e => setForm({ ...form, receiptNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Book Number</label>
                <input value={form.bookNumber || ''} onChange={e => setForm({ ...form, bookNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2" rows={3} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={submitForm} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailFee && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Fee Details">
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-6 w-full sm:max-w-xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-xl font-semibold">Fee Details</h3>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setDetailFee(null)}><X/></button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-500">Student</div>
                  <div className="font-medium">{detailFee.student?.fullName}</div>
                </div>
                <div>
                  <div className="text-gray-500">GR / Roll</div>
                  <div className="font-medium">{detailFee.student?.grNumber || '—'} / {detailFee.student?.rollNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Class</div>
                  <div className="font-medium">{detailFee.className || detailFee.student?.admissionFor || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Month / Year</div>
                  <div className="font-medium">{detailFee.month} {detailFee.year}</div>
                </div>
                <div>
                  <div className="text-gray-500">Fee Type</div>
                  <div className="font-medium capitalize">{detailFee.feeType || 'monthly'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium">{detailFee.status}</div>
                </div>
                <div>
                  <div className="text-gray-500">Paid Date</div>
                  <div className="font-medium">{detailFee.paidDate || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Amount Paid</div>
                  <div className="font-medium">{Number(detailFee.amountPaid || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500">Receipt / Book</div>
                  <div className="font-medium">{detailFee.receiptNumber || '—'} / {detailFee.bookNumber || '—'}</div>
                </div>
              </div>
              {detailFee.notes && (
                <div className="mt-2">
                  <div className="text-gray-500">Notes</div>
                  <div className="font-medium whitespace-pre-wrap">{detailFee.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFees

"use client"

import React, { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Search, RotateCw, Upload, Download, Filter } from 'lucide-react'
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery } from "@/sanity/lib/queries";
import type { Student } from '@/types/student';
import ImageModal from '@/components/ImageModal/ImageModal'
import ImageCropper from '@/components/ImageCropper/ImageCropper'

// Reusable info row renderer (kept at top to avoid any scoping issues)
const Info = ({ label, value }: { label: string; value?: any }) => {
  const toDisplay = (v: any): string => {
    if (v === undefined || v === null || v === '') return '—'
    if (typeof v === 'object') {
      const text = (v as any).text
      const hyperlink = (v as any).hyperlink
      if (typeof text === 'string') return text
      if (typeof hyperlink === 'string') return hyperlink
      try {
        return JSON.stringify(v)
      } catch {
        return String(v)
      }
    }
    return String(v)
  }

  return (
    <div>
      <span className="font-medium">{label}:</span>{" "}
      <span className="text-gray-600">{toDisplay(value)}</span>
    </div>
  )
}

const AdminStudents = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true); // ⏳ Loading state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState<any>({
    fullName: '',
    fatherName: '',
    fatherCnic: '',
    dob: '',
    rollNumber: '',
    grNumber: '',
    gender: 'male',
    admissionFor: '1',
    nationality: 'pakistani',
    medicalCondition: 'no',
    cnicOrBform: '',
    email: '',
    phoneNumber: '0',
    whatsappNumber: '0',
    address: '',
    formerEducation: '',
    previousInstitute: '',
    lastExamPercentage: '',
    guardianName: '',
    guardianContact: '0',
    guardianCnic: '',
    guardianRelation: '',
    photoFile: null as File | null,
  })

  // Sorting helpers will be applied after filteredStudents is computed below

  // Image cropper state
  const [showCropperAdd, setShowCropperAdd] = useState(false)
  const [cropSourceAdd, setCropSourceAdd] = useState<string | null>(null)
  const [showCropperEdit, setShowCropperEdit] = useState(false)
  const [cropSourceEdit, setCropSourceEdit] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [editingPhotoFile, setEditingPhotoFile] = useState<File | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [deleteAllInput, setDeleteAllInput] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [searchField, setSearchField] = useState<'all' | 'fullName' | 'fatherName' | 'grNumber' | 'admissionFor' | 'rollNumber'>('all')
  const [importResultOpen, setImportResultOpen] = useState(false)
  const [importResultMessage, setImportResultMessage] = useState('')
  const [deleteAllMessage, setDeleteAllMessage] = useState('')
  const [imgPreviewOpen, setImgPreviewOpen] = useState(false)
  // Toasts (match AdminSchedule style)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    window.setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true); // Start loading
      onLoadingChange?.(true)
      const data: Student[] = await client.fetch(getAllStudentsQuery);
      setStudents(data.map(normalizeStudent));
      setLoading(false); // Done loading
      onLoadingChange?.(false)
    };

    fetchStudents();
  }, [onLoadingChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const refreshStudents = async () => {
    setLoading(true)
    onLoadingChange?.(true)
    const data: Student[] = await client.fetch(getAllStudentsQuery);
    setStudents(data.map(normalizeStudent))
    setLoading(false)
    onLoadingChange?.(false)
  }

  // Normalize a Student record so that all searchable/sortable fields are plain strings
  const normalizeStudent = (s: any): Student => {
    return {
      _id: s._id,
      fullName: cellToString(s.fullName),
      fatherName: cellToString(s.fatherName),
      fatherCnic: cellToString(s.fatherCnic),
      dob: cellToString(s.dob),
      rollNumber: cellToString(s.rollNumber),
      grNumber: cellToString(s.grNumber),
      gender: cellToString(s.gender),
      admissionFor: cellToString(s.admissionFor),
      nationality: cellToString(s.nationality),
      medicalCondition: cellToString(s.medicalCondition),
      cnicOrBform: cellToString(s.cnicOrBform),
      email: cellToString(s.email),
      phoneNumber: cellToString(s.phoneNumber),
      whatsappNumber: cellToString(s.whatsappNumber),
      address: cellToString(s.address),
      formerEducation: cellToString(s.formerEducation),
      previousInstitute: cellToString(s.previousInstitute),
      lastExamPercentage: cellToString(s.lastExamPercentage),
      guardianName: cellToString(s.guardianName),
      guardianContact: cellToString(s.guardianContact),
      guardianCnic: cellToString(s.guardianCnic),
      guardianRelation: cellToString(s.guardianRelation),
      photoUrl: cellToString(s.photoUrl),
    }
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return
    setEditLoading(true)
    try {
      const body: any = { ...editingStudent }
      if (editingPhotoFile) {
        const imageRef = await uploadPhotoAndGetRef(editingPhotoFile)
        body.photo = imageRef
      }
      delete body.photoFile

      const res = await fetch('/api/students', {
        method: 'PATCH',
        body: JSON.stringify({ id: editingStudent._id, patch: body }),
        headers: { 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Update failed')
      setShowEditModal(false)
      setEditingPhotoFile(null)
      await refreshStudents()
    } catch (error) {
      console.error('Failed to update student', error)
      showToast('Failed to update student', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const uploadPhotoAndGetRef = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Upload failed')
    // return Sanity image reference object
    return { _type: 'image', asset: { _type: 'reference', _ref: json.assetId } }
  }

  // helper to render avatar initial
  const getInitial = (name?: string) => {
    if (!name) return 'A'
    const first = name.trim().charAt(0).toUpperCase()
    return first || 'A'
  }

  const handleCreateStudent = async () => {
    setCreateLoading(true)
    try {
      const body: any = { ...newStudent }
      if (body.photoFile) {
        const imageRef = await uploadPhotoAndGetRef(body.photoFile)
        body.photo = imageRef
      }
      delete body.photoFile
      const res = await fetch('/api/students', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Create failed')
      setShowAddModal(false)
      setNewStudent({
        fullName: '',
        fatherName: '',
        fatherCnic: '',
        dob: '',
        rollNumber: '',
        grNumber: '',
        gender: 'male',
        admissionFor: '1',
        nationality: 'pakistani',
        medicalCondition: 'no',
        cnicOrBform: '',
        email: '',
        phoneNumber: '0',
        whatsappNumber: '0',
        address: '',
        formerEducation: '',
        previousInstitute: '',
        lastExamPercentage: '',
        guardianName: '',
        guardianContact: '0',
        guardianCnic: '',
        guardianRelation: '',
        photoFile: null,
      })
      await refreshStudents()
    } catch (err) {
      console.error('Failed to create student', err)
      showToast('Failed to create student', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    setDeleteLoadingId(id)
    try {
      const res = await fetch('/api/students', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Delete failed')
      await refreshStudents()
    } catch (err) {
      console.error('Failed to delete student', err)
      showToast('Failed to delete student', 'error')
    } finally {
      setDeleteLoadingId(null)
      setConfirmDeleteId(null)
    }
  }

  const loadExcel = async () => {
    try {
      // Try main exceljs module first
      const ExcelJS = await import('exceljs')
      return ExcelJS.default || ExcelJS
    } catch (error: any) {
      console.error('Failed to load ExcelJS:', error)
      throw new Error('ExcelJS library could not be loaded. Please make sure it is installed.')
    }
  }

  // Flexible date parser to normalize different date formats to YYYY-MM-DD
  // Supports:
  // - d/m/yyyy or dd/mm/yyyy
  // - d-m-yyyy or dd-mm-yyyy
  // - Excel date serial numbers
  // - Already normalized yyyy-mm-dd (returns as-is)
  const parseDateFlexible = (value: any): string => {
    if (!value) return ''
    try {
      // If it's already in ISO-like yyyy-mm-dd
      if (typeof value === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number)
        const mm = String(m).padStart(2, '0')
        const dd = String(d).padStart(2, '0')
        return `${y}-${mm}-${dd}`
      }

      // Handle d/m/yyyy or d-m-yyyy
      if (typeof value === 'string' && /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.test(value.trim())) {
        const match = value.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (match) {
          const d = Number(match[1])
          const m = Number(match[2])
          const y = Number(match[3])
          const mm = String(m).padStart(2, '0')
          const dd = String(d).padStart(2, '0')
          return `${y}-${mm}-${dd}`
        }
      }

      // Handle Excel serial date numbers
      if (typeof value === 'number') {
        // Excel serial date: days since 1899-12-30
        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
        const ms = value * 24 * 60 * 60 * 1000
        const date = new Date(excelEpoch.getTime() + ms)
        const y = date.getUTCFullYear()
        const m = String(date.getUTCMonth() + 1).padStart(2, '0')
        const d = String(date.getUTCDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }

      // Fallback: try Date.parse
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear()
        const m = String(parsed.getMonth() + 1).padStart(2, '0')
        const d = String(parsed.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    } catch { }
    // If nothing worked, return original string (or empty)
    return typeof value === 'string' ? value : ''
  }

  // Convert ExcelJS cell values (including hyperlink objects) to plain strings
  const cellToString = (value: any): string => {
    if (value == null) return ''
    if (typeof value === 'object') {
      const text = (value as any).text
      const hyperlink = (value as any).hyperlink
      if (typeof text === 'string') return text
      if (typeof hyperlink === 'string') return hyperlink
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  // Safely render any value as text for JSX (avoids React error #31 for objects)
  const renderText = (value: any): string => {
    if (value === undefined || value === null) return ''
    if (typeof value === 'object') {
      const text = (value as any).text
      const hyperlink = (value as any).hyperlink
      if (typeof text === 'string') return text
      if (typeof hyperlink === 'string') return hyperlink
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }
    return String(value)
  }

  const handleExportExcel = async () => {
    try {
      console.log('Starting Excel export...')

      if (students.length === 0) {
        showToast('Koi students nahi hain export karne ke liye!', 'error')
        return
      }

      const ExcelJS: any = await loadExcel()
      const fileSaver = await import('file-saver')
      const saveAs = fileSaver.default?.saveAs || fileSaver.saveAs

      console.log('ExcelJS loaded successfully')

      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Students')

      // Define columns
      ws.columns = [
        { header: 'Full Name', key: 'fullName', width: 25 },
        { header: "Father's Name", key: 'fatherName', width: 25 },
        { header: "Father CNIC", key: 'fatherCnic', width: 18 },
        { header: 'DOB', key: 'dob', width: 15 },
        { header: 'Roll No', key: 'rollNumber', width: 12 },
        { header: 'GR Number', key: 'grNumber', width: 15 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Class', key: 'admissionFor', width: 10 },
        { header: 'Nationality', key: 'nationality', width: 15 },
        { header: 'Medical', key: 'medicalCondition', width: 10 },
        { header: 'CNIC/B-Form', key: 'cnicOrBform', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phoneNumber', width: 15 },
        { header: 'WhatsApp', key: 'whatsappNumber', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Former Edu', key: 'formerEducation', width: 12 },
        { header: 'Prev Institute', key: 'previousInstitute', width: 20 },
        { header: 'Last %', key: 'lastExamPercentage', width: 10 },
        { header: 'Guardian Name', key: 'guardianName', width: 20 },
        { header: 'Guardian Contact', key: 'guardianContact', width: 18 },
        { header: 'Guardian CNIC', key: 'guardianCnic', width: 18 },
        { header: 'Relation', key: 'guardianRelation', width: 12 },
      ]

      // Add student data rows
      console.log(`Adding ${students.length} students to Excel...`)
      students.forEach((student, index) => {
        ws.addRow({
          fullName: student.fullName || '',
          fatherName: student.fatherName || '',
          fatherCnic: (student as any).fatherCnic || '',
          dob: student.dob || '',
          rollNumber: student.rollNumber || '',
          grNumber: student.grNumber || '',
          gender: student.gender || '',
          admissionFor: student.admissionFor || '',
          nationality: student.nationality || '',
          medicalCondition: student.medicalCondition || '',
          cnicOrBform: student.cnicOrBform || '',
          email: student.email || '',
          phoneNumber: student.phoneNumber || '',
          whatsappNumber: student.whatsappNumber || '',
          address: student.address || '',
          formerEducation: student.formerEducation || '',
          previousInstitute: student.previousInstitute || '',
          lastExamPercentage: student.lastExamPercentage || '',
          guardianName: student.guardianName || '',
          guardianContact: student.guardianContact || '',
          guardianCnic: student.guardianCnic || '',
          guardianRelation: student.guardianRelation || ''
        })
      })

      console.log('Generating Excel buffer...')
      const buffer = await wb.xlsx.writeBuffer()

      console.log('Creating file blob...')
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      console.log('Downloading file...')
      const fileName = `students_${new Date().toISOString().split('T')[0]}.xlsx`

      // Try saveAs first, fallback to manual download
      if (saveAs && typeof saveAs === 'function') {
        saveAs(blob, fileName)
      } else {
        // Manual download fallback
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      showToast(`Excel file successfully exported! (${students.length} students)`, 'success')

    } catch (error: any) {
      console.error('Excel export error:', error)
      showToast(`Excel export mein error aaya: ${error?.message || 'Unknown error'}`, 'error')
    }
  }

  const fileInputRefId = 'students-import-input'
  const handleImportExcelClick = () => {
    const el = document.getElementById(fileInputRefId) as HTMLInputElement | null
    el?.click()
  }
  const handleImportExcelFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImportLoading(true)
      console.log('Starting Excel import...')
      const ExcelJS: any = await loadExcel()
      const wb = new ExcelJS.Workbook()
      const buf = await file.arrayBuffer()
      await wb.xlsx.load(buf)
      const ws = wb.worksheets[0]
      const rows = ws.getSheetValues()

      console.log('Excel file loaded, processing rows...')

      // Skip header (index 1)
      const toCreate: any[] = []
      for (let i = 2; i < rows.length; i++) {
        const r: any = rows[i]
        if (!r || !r[1]) continue // Skip empty rows

        toCreate.push({
          fullName: cellToString(r[1]),
          fatherName: cellToString(r[2]),
          dob: parseDateFlexible(r[3] ?? ''),
          rollNumber: cellToString(r[4]),
          grNumber: cellToString(r[5]),
          gender: cellToString(r[6]) || 'male',
          admissionFor: cellToString(r[7]) || '1',
          nationality: cellToString(r[8]) || 'pakistani',
          medicalCondition: cellToString(r[9]) || 'no',
          cnicOrBform: cellToString(r[10]),
          email: cellToString(r[11]),
          phoneNumber: cellToString(r[12]),
          whatsappNumber: cellToString(r[13]),
          address: cellToString(r[14]),
          formerEducation: cellToString(r[15]),
          previousInstitute: cellToString(r[16]),
          lastExamPercentage: cellToString(r[17]),
          guardianName: cellToString(r[18]),
          guardianContact: cellToString(r[19]),
          guardianCnic: cellToString(r[20]),
          guardianRelation: cellToString(r[21]),
        })
      }

      console.log(`Importing ${toCreate.length} students...`)

      // Bulk create sequentially
      let successCount = 0
      for (const doc of toCreate) {
        try {
          const res = await fetch('/api/students', {
            method: 'POST',
            body: JSON.stringify(doc),
            headers: { 'Content-Type': 'application/json' }
          })
          const result = await res.json()
          if (result.ok) {
            successCount++
          }
        } catch (err) {
          console.error('Error importing student:', doc.fullName, err)
        }
      }

      await refreshStudents()
      setImportResultMessage(`${successCount} out of ${toCreate.length} students imported successfully.`)
      setImportResultOpen(true)

    } catch (error: any) {
      console.error('Excel import error:', error)
      showToast(`Excel import mein error aaya: ${error?.message || 'Unknown error'}`, 'error')
    } finally {
      setImportLoading(false)
      // Reset file input safely (React synthetic event's currentTarget can be null after async)
      const inputEl = document.getElementById(fileInputRefId) as HTMLInputElement | null
      if (inputEl) inputEl.value = ''
    }
  }

  // derive filtered list once to use in both table and cards
  const filteredStudents = students.filter(student => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    const safeVal = (v: any) => (v ?? '').toString().toLowerCase()
    if (searchField === 'all') {
      return [student.rollNumber, student.fullName, student.fatherName, student.grNumber, student.admissionFor]
        .some(v => safeVal(v).includes(term))
    }
    const raw: any = (student as any)[searchField]
    return safeVal(raw).includes(term)
  })

  // Sorting: Class order (KG, 1..8, SSCI, SSCII) then numeric Roll No
  const classOrder = ['KG','1','2','3','4','5','6','7','8','SSCI','SSCII']
  const classIndex = (cls: string) => {
    const c = (cls || '').toString()
    const idx = classOrder.indexOf(c)
    if (idx >= 0) return idx
    const n = parseInt(c, 10)
    return isNaN(n) ? 999 : n
  }
  const numOrInf = (v: string) => {
    const n = parseInt((v || '').toString().replace(/[^0-9]/g, ''), 10)
    return isNaN(n) ? Number.POSITIVE_INFINITY : n
  }
  const sortedStudents: Student[] = [...filteredStudents].sort((a, b) => {
    const byClass = classIndex(a.admissionFor) - classIndex(b.admissionFor)
    if (byClass !== 0) return byClass
    return numOrInf(a.rollNumber) - numOrInf(b.rollNumber)
  })

  // Note: Delete All handled via confirmation modal below

  return (
    <div>
      <div className="space-y-4 pb-14">
        {/* Row 1: Search and Filter (full width) */}
        <div className="w-full bg-white p-3 rounded-xl shadow sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            </div>
            <div className="relative w-full sm:w-56 filter-dropdown">
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className="px-3 py-3 sm:py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 w-full"
                title="Filter"
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filter</span>
              </button>
              {showFilterMenu && (
                <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg w-56 p-1 right-0">
                  <div className="px-3 py-1 text-xs text-gray-500">Filter by</div>
                  {(['all','rollNumber', 'fullName', 'fatherName', 'grNumber', 'admissionFor'] as const).map(opt => (
                    <button key={opt} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${searchField === opt ? 'bg-blue-100 text-blue-700' : ''}`} onClick={() => { setSearchField(opt); setShowFilterMenu(false); }}>
                      {opt === 'all' && 'All fields'}
                      {opt === 'fullName' && 'Student Name'}
                      {opt === 'fatherName' && "Father's Name"}
                      {opt === 'grNumber' && 'GR Number'}
                      {opt === 'admissionFor' && 'Class'}
                      {opt === 'rollNumber' && 'Roll Number'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Row 2: Actions (full width; wrap nicely; right-aligned) */}
        <div className="flex flex-wrap items-stretch sm:items-center justify-end gap-2 w-full">
            {/* Refresh */}
            <button
              onClick={refreshStudents}
              className="px-4 h-10 md:h-11 border border-gray-200 rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-gray-50 hover:shadow-sm transition text-sm w-full sm:w-auto"
              title="Refresh table"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline font-medium">Refresh</span>
            </button>
            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="px-4 h-10 md:h-11 border border-gray-200 rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 hover:shadow-sm transition text-sm w-full sm:w-auto"
              title="Export students to Excel"
            >
              <Download size={16} />
              <span className="hidden sm:inline font-medium">Export</span>
            </button>
            {/* Import Excel */}
            <button
              onClick={handleImportExcelClick}
              className="px-4 h-10 md:h-11 border border-gray-200 rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 hover:shadow-sm transition text-sm w-full sm:w-auto"
              title="Import students from Excel"
            >
              <Upload size={16} />
              <span className="hidden sm:inline font-medium">Import</span>
            </button>
            {/* Hidden file input for import */}
            <input id={fileInputRefId} type="file" accept=".xlsx" className="hidden" onChange={handleImportExcelFile} />
            {/* Delete All */}
            <button
              onClick={() => {
                if (students.length === 0) {
                  setDeleteAllMessage('No students to delete.')
                  setShowDeleteAllConfirm(true)
                  return
                }
                setDeleteAllMessage('')
                setShowDeleteAllConfirm(true)
              }}
              className="px-4 h-10 md:h-11 border border-red-300 text-red-700 rounded-lg flex items-center justify-center gap-2 bg-white hover:bg-red-50 hover:shadow-sm transition text-sm w-full sm:w-auto"
              title="Delete all students"
            >
              <span className="font-medium">Delete All</span>
            </button>
            {/* Add Student */}
            <button
              onClick={() => { console.log('Add button clicked'); setShowAddModal(true) }}
              className="px-5 h-10 md:h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm shadow hover:opacity-95 w-full sm:w-auto font-medium"
            >
              Add Student
            </button>
        </div>
        </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Add Student">
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-6 w-full sm:max-w-2xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-xl font-semibold">Add Student</h3>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setShowAddModal(false)}>Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input value={newStudent.fullName} onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Father's Name</label>
                <input value={newStudent.fatherName} onChange={(e) => setNewStudent({ ...newStudent, fatherName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" value={newStudent.dob} onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GR Number</label>
                <input value={newStudent.grNumber} onChange={(e) => setNewStudent({ ...newStudent, grNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Roll Number</label>
                <input value={newStudent.rollNumber} onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select value={newStudent.admissionFor} onChange={(e) => setNewStudent({ ...newStudent, admissionFor: e.target.value })} className="w-full border rounded px-3 py-2">
                  {['KG','1','2','3','4','5','6','7','8','SSCI','SSCII'].map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Father CNIC</label>
                <input value={newStudent.fatherCnic} onChange={(e) => setNewStudent({ ...newStudent, fatherCnic: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="genderAdd" checked={newStudent.gender === 'male'} onChange={() => setNewStudent({ ...newStudent, gender: 'male' })} /> Male</label>
                  <label className="flex items-center gap-2"><input type="radio" name="genderAdd" checked={newStudent.gender === 'female'} onChange={() => setNewStudent({ ...newStudent, gender: 'female' })} /> Female</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="nationalityAdd" checked={newStudent.nationality === 'pakistani'} onChange={() => setNewStudent({ ...newStudent, nationality: 'pakistani' })} /> Pakistani</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Any Medical Condition</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="medicalAdd" checked={newStudent.medicalCondition === 'yes'} onChange={() => setNewStudent({ ...newStudent, medicalCondition: 'yes' })} /> Yes</label>
                  <label className="flex items-center gap-2"><input type="radio" name="medicalAdd" checked={newStudent.medicalCondition === 'no'} onChange={() => setNewStudent({ ...newStudent, medicalCondition: 'no' })} /> No</label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">CNIC / B-Form Number</label>
                <input value={newStudent.cnicOrBform} onChange={(e) => setNewStudent({ ...newStudent, cnicOrBform: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input value={newStudent.phoneNumber} onChange={(e) => {
                  const raw = e.target.value || ''
                  const sanitized = raw.replace(/[^0-9]/g, '')
                  const withZero = sanitized.startsWith('0') ? sanitized : ('0' + sanitized)
                  setNewStudent({ ...newStudent, phoneNumber: withZero })
                }} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                <input value={newStudent.whatsappNumber} onChange={(e) => {
                  const raw = e.target.value || ''
                  const sanitized = raw.replace(/[^0-9]/g, '')
                  const withZero = sanitized.startsWith('0') ? sanitized : ('0' + sanitized)
                  setNewStudent({ ...newStudent, whatsappNumber: withZero })
                }} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea value={newStudent.address} onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })} className="w-full border rounded px-3 py-2" rows={2} />
              </div>

              {/* Academic */}
              <div>
                <label className="block text-sm font-medium mb-1">Former Education</label>
                <select value={newStudent.formerEducation} onChange={(e) => setNewStudent({ ...newStudent, formerEducation: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  {['KG','1','2','3','4','5','6','7','8','SSCI','SSCII'].map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Previous Institute</label>
                <input value={newStudent.previousInstitute} onChange={(e) => setNewStudent({ ...newStudent, previousInstitute: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Exam Percentage</label>
                <input value={newStudent.lastExamPercentage} onChange={(e) => setNewStudent({ ...newStudent, lastExamPercentage: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>

              {/* Guardian */}
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Name</label>
                <input value={newStudent.guardianName} onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Contact</label>
                <input value={newStudent.guardianContact} onChange={(e) => {
                  const raw = e.target.value || ''
                  const sanitized = raw.replace(/[^0-9]/g, '')
                  const withZero = sanitized.startsWith('0') ? sanitized : ('0' + sanitized)
                  setNewStudent({ ...newStudent, guardianContact: withZero })
                }} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian CNIC</label>
                <input value={newStudent.guardianCnic} onChange={(e) => setNewStudent({ ...newStudent, guardianCnic: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Relation</label>
                <div className="flex flex-wrap items-center gap-4">
                  {['son','daughter','brother','sister','other'].map(rel => (
                    <label key={rel} className="flex items-center gap-2"><input type="radio" name="guardianRelAdd" checked={newStudent.guardianRelation === rel} onChange={() => setNewStudent({ ...newStudent, guardianRelation: rel })} /> {rel[0].toUpperCase()+rel.slice(1)}</label>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Student Photo</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    const reader = new FileReader()
                    reader.onload = () => { setCropSourceAdd(String(reader.result || '')) ; setShowCropperAdd(true) }
                    reader.readAsDataURL(f)
                  }
                }} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded w-full sm:w-auto">Cancel</button>
              <button onClick={handleCreateStudent} disabled={createLoading} className="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto">{createLoading ? 'Creating...' : 'Create'}</button>
            </div>
            <ImageModal open={imgPreviewOpen} src={selectedStudent?.photoUrl} alt={selectedStudent?.fullName || 'Student Photo'} onClose={() => setImgPreviewOpen(false)} />
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Edit Student">
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-6 w-full sm:max-w-2xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-xl font-semibold">Edit Student</h3>
              <button className="text-gray-500 hover:text-red-600" onClick={() => setShowEditModal(false)}>Close</button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input value={editingStudent.fullName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Father's Name</label>
                <input value={editingStudent.fatherName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" value={editingStudent.dob || ''} onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GR Number</label>
                <input value={editingStudent.grNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, grNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Roll Number</label>
                <input value={editingStudent.rollNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select value={editingStudent.admissionFor || ''} onChange={(e) => setEditingStudent({ ...editingStudent, admissionFor: e.target.value })} className="w-full border rounded px-3 py-2">
                  {['KG','1','2','3','4','5','6','7','8','SSCI','SSCII'].map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Father CNIC</label>
                <input value={editingStudent.fatherCnic || ''} onChange={(e) => setEditingStudent({ ...editingStudent, fatherCnic: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="genderEdit" checked={editingStudent.gender === 'male'} onChange={() => setEditingStudent({ ...editingStudent, gender: 'male' })} /> Male</label>
                  <label className="flex items-center gap-2"><input type="radio" name="genderEdit" checked={editingStudent.gender === 'female'} onChange={() => setEditingStudent({ ...editingStudent, gender: 'female' })} /> Female</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="nationalityEdit" checked={editingStudent.nationality === 'pakistani'} onChange={() => setEditingStudent({ ...editingStudent, nationality: 'pakistani' })} /> Pakistani</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Any Medical Condition</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2"><input type="radio" name="medicalEdit" checked={editingStudent.medicalCondition === 'yes'} onChange={() => setEditingStudent({ ...editingStudent, medicalCondition: 'yes' })} /> Yes</label>
                  <label className="flex items-center gap-2"><input type="radio" name="medicalEdit" checked={editingStudent.medicalCondition === 'no'} onChange={() => setEditingStudent({ ...editingStudent, medicalCondition: 'no' })} /> No</label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">CNIC / B-Form Number</label>
                <input value={editingStudent.cnicOrBform || ''} onChange={(e) => setEditingStudent({ ...editingStudent, cnicOrBform: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={editingStudent.email || ''} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input value={editingStudent.phoneNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phoneNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                <input value={editingStudent.whatsappNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, whatsappNumber: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea value={editingStudent.address || ''} onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })} className="w-full border rounded px-3 py-2" rows={2} />
              </div>

              {/* Academic */}
              <div>
                <label className="block text-sm font-medium mb-1">Former Education</label>
                <select value={editingStudent.formerEducation || ''} onChange={(e) => setEditingStudent({ ...editingStudent, formerEducation: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  {['KG','1','2','3','4','5','6','7','8','SSCI','SSCII'].map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Previous Institute</label>
                <input value={editingStudent.previousInstitute || ''} onChange={(e) => setEditingStudent({ ...editingStudent, previousInstitute: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Exam Percentage</label>
                <input value={editingStudent.lastExamPercentage || ''} onChange={(e) => setEditingStudent({ ...editingStudent, lastExamPercentage: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>

              {/* Guardian */}
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Name</label>
                <input value={editingStudent.guardianName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Contact</label>
                <input value={editingStudent.guardianContact || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianContact: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian CNIC</label>
                <input value={editingStudent.guardianCnic || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianCnic: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guardian Relation</label>
                <div className="flex flex-wrap items-center gap-4">
                  {['son','daughter','brother','sister','other'].map(rel => (
                    <label key={rel} className="flex items-center gap-2"><input type="radio" name="guardianRelEdit" checked={editingStudent.guardianRelation === rel} onChange={() => setEditingStudent({ ...editingStudent, guardianRelation: rel })} /> {rel[0].toUpperCase()+rel.slice(1)}</label>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Student Photo</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    const reader = new FileReader()
                    reader.onload = () => { setCropSourceEdit(String(reader.result || '')) ; setShowCropperEdit(true) }
                    reader.readAsDataURL(f)
                  }
                }} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded w-full sm:w-auto">Cancel</button>
              <button onClick={handleUpdateStudent} disabled={editLoading} className="px-4 py-2 bg-yellow-600 text-white rounded w-full sm:w-auto">{editLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Student Details">
          <div className="bg-white sm:rounded-2xl rounded-none p-4 sm:p-8 w-full sm:w-full sm:max-w-4xl max-w-none h-full sm:h-auto relative shadow-2xl border border-gray-200 overflow-y-auto sm:max-h-[90vh] my-0 sm:my-10">

            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl font-bold p-2 rounded-full focus:outline-none focus:ring"
              onClick={() => setSelectedStudent(null)}
              aria-label="Close"
            >
              &times;
            </button>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
              👨‍🎓 Student Details
            </h2>

            {/* Photo */}
            {selectedStudent.photoUrl && (
              <div className="flex justify-center mb-6">
                <img
                  src={selectedStudent.photoUrl}
                  alt="Student"
                  className="w-32 h-32 object-cover rounded-full border shadow-md cursor-zoom-in"
                  onClick={() => setImgPreviewOpen(true)}
                  title="Click to enlarge"
                />
              </div>
            )}

            {/* SECTION: Personal Information */}
            <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6 border-b pb-1">👤 Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-800 text-sm">
              <Info label="Full Name" value={selectedStudent.fullName} />
              <Info label="Father's Name" value={selectedStudent.fatherName} />
              <Info label="Date of Birth" value={selectedStudent.dob} />
              <Info label="Father CNIC" value={(selectedStudent as any).fatherCnic} />
              <Info label="Roll Number" value={selectedStudent.rollNumber} />
              <Info label="GR Number" value={selectedStudent.grNumber} />
              <Info label="Gender" value={selectedStudent.gender} />
              <Info label="Class" value={selectedStudent.admissionFor} />
              <Info label="Nationality" value={selectedStudent.nationality} />
              <Info label="Medical Condition" value={selectedStudent.medicalCondition} />
              <Info label="CNIC/B-Form" value={selectedStudent.cnicOrBform} />
            </div>

            {/* SECTION: Contact Information */}
            <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6 border-b pb-1">📞 Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-800 text-sm">
              <Info label="Email" value={selectedStudent.email} />
              <Info label="Phone Number" value={selectedStudent.phoneNumber} />
              <Info label="WhatsApp Number" value={selectedStudent.whatsappNumber} />
              <div className="sm:col-span-2">
                <Info label="Address" value={selectedStudent.address} />
              </div>
            </div>

            {/* SECTION: Academic Information */}
            <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6 border-b pb-1">📚 Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-800 text-sm">
              <Info label="Former Education" value={selectedStudent.formerEducation} />
              <Info label="Previous Institute" value={selectedStudent.previousInstitute} />
              <Info label="Last Exam %" value={selectedStudent.lastExamPercentage} />
            </div>

            {/* SECTION: Guardian Details */}
            <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6 border-b pb-1">👨‍👩‍👧 Guardian Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-800 text-sm">
              <Info label="Guardian Name" value={selectedStudent.guardianName} />
              <Info label="Guardian Contact" value={selectedStudent.guardianContact} />
              <Info label="Guardian CNIC" value={selectedStudent.guardianCnic} />
              <Info label="Guardian Relation" value={selectedStudent.guardianRelation} />
            </div>
            <ImageModal open={imgPreviewOpen} src={selectedStudent?.photoUrl} alt={selectedStudent?.fullName || 'Student Photo'} onClose={() => setImgPreviewOpen(false)} />
          </div>
        </div>
      )}






      {/* 👇 Table (Desktop and Tablets md+) */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GR Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B-Form</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {(loading || importLoading) ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <div className="text-blue-600 font-semibold text-lg tracking-wide">
                        Loading students...
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStudents
                  .map((student: Student, index: number) => (
                    <tr
                      key={student.grNumber}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setSelectedStudent(student) }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.fullName}
                              className="max-h-10 w-auto rounded-md object-contain"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                              {getInitial(student.fullName)}
                            </div>
                          )}
                          <div className="ml-3 min-w-0">
                            <div
                              className="text-sm font-medium text-gray-900 max-w-[180px] truncate"
                              title={renderText(student.fullName)}
                            >
                              {renderText(student.fullName)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div
                          className="max-w-[180px] truncate"
                          title={renderText(student.fatherName)}
                        >
                          {renderText(student.fatherName)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renderText(student.grNumber)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renderText(student.cnicOrBform)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renderText(student.admissionFor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{renderText(student.rollNumber)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button onClick={(e) => { e.stopPropagation(); console.log('Edit clicked', student); setEditingStudent(student); setShowEditModal(true); }} className="text-yellow-600 mr-3">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); console.log('Delete clicked', (student as any)._id); setConfirmDeleteId((student as any)._id) }} className="text-red-600">{deleteLoadingId === (student as any)._id ? 'Deleting...' : 'Delete'}</button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👇 Cards list (Mobile only) */}
      <div className="md:hidden space-y-3">
        {(loading || importLoading) ? (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-blue-600 font-semibold">Loading students...</div>
          </div>
        ) : sortedStudents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">No students found</div>
        ) : (
          sortedStudents.map((student: Student, index: number) => (
            <div
              key={student.grNumber}
              className="bg-white rounded-2xl shadow border p-4 cursor-pointer"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="flex items-center gap-3">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.fullName} className="max-h-12 w-auto rounded-md object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">
                    {getInitial(student.fullName)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{student.fullName}</div>
                  <div className="text-xs text-gray-500">GR: {student.grNumber} • Class: {student.admissionFor}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div><span className="text-gray-500">Father:</span> {student.fatherName}</div>
                <div><span className="text-gray-500">B-Form:</span> {student.cnicOrBform}</div>
                <div><span className="text-gray-500">Roll No:</span> {student.rollNumber}</div>
              </div>
              <div className="mt-3 flex justify-end gap-3 text-sm">
                <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); setShowEditModal(true); }} className="text-yellow-600">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId((student as any)._id) }} className="text-red-600">{deleteLoadingId === (student as any)._id ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Delete Student Confirmation">
          <div className="bg-white sm:rounded-xl rounded-none p-6 w-full sm:max-w-sm max-w-none h-auto sm:h-auto shadow-2xl border">
            <h4 className="text-lg font-semibold mb-2">Delete Student</h4>
            <p className="text-sm text-gray-600 mb-4">Kya aap sure hain ke is student ko delete karna chahte hain? Ye action wapas nahin hoga.</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setConfirmDeleteId(null)}>No</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => handleDeleteStudent(confirmDeleteId!)}>
                {deleteLoadingId === confirmDeleteId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper for Add */}
      {showCropperAdd && cropSourceAdd && (
        <ImageCropper
          src={cropSourceAdd}
          onCancel={() => { setShowCropperAdd(false); setCropSourceAdd(null) }}
          onCropped={(file) => {
            setNewStudent((prev: any) => ({ ...prev, photoFile: file }))
            setShowCropperAdd(false)
            setCropSourceAdd(null)
          }}
        />
      )}

      {/* Cropper for Edit */}
      {showCropperEdit && cropSourceEdit && (
        <ImageCropper
          src={cropSourceEdit}
          onCancel={() => { setShowCropperEdit(false); setCropSourceEdit(null) }}
          onCropped={(file) => {
            setEditingPhotoFile(file)
            setShowCropperEdit(false)
            setCropSourceEdit(null)
          }}
        />
      )}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Delete All Students Confirmation">
          <div className="bg-white sm:rounded-xl rounded-none p-6 w-full sm:max-w-sm max-w-none h-auto sm:h-auto shadow-2xl border">
            <h4 className="text-lg font-semibold mb-2">Delete ALL Students</h4>
            <p className="text-sm text-gray-600 mb-4">Is action se tamam students delete ho jayenge. Confirm karne ke liye niche <span className="font-semibold">DELETE</span> type karein.</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllInput(''); setDeleteAllMessage(''); }}>Close</button>
              <button
                disabled={deleteAllInput !== 'DELETE' || loading || students.length === 0}
                onClick={async () => {
                  setLoading(true)
                  try {
                    const res = await fetch('/api/students?all=true', { method: 'DELETE' })
                    const json = await res.json()
                    if (!json.ok) throw new Error(json.error || 'Bulk delete failed')
                    await refreshStudents()
                    setDeleteAllMessage('All students deleted successfully.')
                    setDeleteAllInput('')
                  } catch (err) {
                    console.error('Failed to delete all students', err)
                    setDeleteAllMessage('Failed to delete all students')
                  } finally {
                    setLoading(false)
                  }
                }}
                className={`px-4 py-2 rounded text-white ${deleteAllInput === 'DELETE' && !loading && students.length > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
              >
                {loading ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
            {deleteAllMessage && (
              <div className={`mt-3 text-sm ${deleteAllMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{deleteAllMessage}</div>
            )}
          </div>
        </div>
      )}

      
    </div>
  );
};

export default AdminStudents;

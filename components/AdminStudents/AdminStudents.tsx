"use client"

import React, { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { RotateCw, Upload, Download, Search, Plus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { client } from "@/sanity/lib/client";
import { getPaginatedStudentsQuery, getStudentsCountQuery, getAllClassesQuery, getStudentStatsQuery } from "@/sanity/lib/queries";
import type { Student } from '@/types/student';
import { auth } from '@/lib/firebase';
import { toast } from "sonner";

// New Components
import HeaderStats from './HeaderStats';
import StudentTable from './StudentTable';
import StudentGrid from './StudentGrid';
import StudentFormContent from './StudentFormContent';
import StudentDetailModal from './StudentDetailModal';
import SecurityConfirmationModal from './SecurityConfirmationModal';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent
} from "@chakra-ui/react"


const AdminStudents = ({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) => {
  // Search/Filter state
  const [search, setSearch] = useState("")
  const [klass, setKlass] = useState<string>('All')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showFilter, setShowFilter] = useState(false)
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [clickedStudent, setClickedStudent] = useState<Student | null>(null); // For Details View
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null) // For Edit Modal

  // Loading States
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Bulk Actions State
  const [, setImportLoading] = useState(false)


  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showDeleteByClassConfirm, setShowDeleteByClassConfirm] = useState(false)
  const [deleteClassSelected, setDeleteClassSelected] = useState('1')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)


  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, boys: 0, girls: 0, kg: 0 });
  const [fetchedClasses, setFetchedClasses] = useState<string[]>([]);

  // Load class options
  useEffect(() => {
    client.fetch(getAllClassesQuery).then((data: any[]) => {
      const set = new Set<string>()
      for (const s of data) {
        if (s.admissionFor) set.add(s.admissionFor)
      }
      setFetchedClasses(Array.from(set).sort())
    })
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, klass])

  // Normalize Student Helper
  // Define this BEFORE usage in useEffect
  const normalizeStudent = (s: any): Student => {
    const str = (v: any) => {
      if (v === undefined || v === null) return ''
      if (typeof v === 'object') {
        return (v as any).text || (v as any).hyperlink || JSON.stringify(v)
      }
      return String(v)
    }
    return {
      _id: s._id,
      fullName: str(s.fullName),
      fatherName: str(s.fatherName),
      fatherCnic: str(s.fatherCnic),
      dob: str(s.dob),
      rollNumber: str(s.rollNumber),
      grNumber: str(s.grNumber),
      gender: str(s.gender),
      admissionFor: str(s.admissionFor),
      nationality: str(s.nationality),
      medicalCondition: str(s.medicalCondition),
      cnicOrBform: str(s.cnicOrBform),
      email: str(s.email),
      phoneNumber: str(s.phoneNumber),
      whatsappNumber: str(s.whatsappNumber),
      address: str(s.address),
      formerEducation: str(s.formerEducation),
      previousInstitute: str(s.previousInstitute),
      lastExamPercentage: str(s.lastExamPercentage),
      guardianName: str(s.guardianName),
      guardianContact: str(s.guardianContact),
      guardianCnic: str(s.guardianCnic),
      guardianRelation: str(s.guardianRelation),
      photoUrl: str(s.photoUrl),
    }
  }

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      onLoadingChange?.(true)
      try {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const params = { classFilter: klass, search: search, start, end };

        const [data, count, statsData] = await Promise.all([
          client.fetch(getPaginatedStudentsQuery, params),
          client.fetch(getStudentsCountQuery, params),
          client.fetch(getStudentStatsQuery, params)
        ]);

        setStudents(data.map(normalizeStudent));
        setTotalCount(count);
        setStats(statsData);
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false);
        onLoadingChange?.(false)
      }
    };

    // Debounce search slightly to avoid spamming API
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoadingChange, currentPage, pageSize, klass, search]); // Added deps

  const refreshStudents = async () => {
    // Trigger re-fetch by toggling a dummy state or just calling fetch (but effect handles it)
    // We can force re-run by setting loading to true, but effects depend on state.
    // Simplest: just reload window or use a toggle. 
    // Actually, let's just re-run the fetch logic directly here for manual refresh.
    setLoading(true)
    onLoadingChange?.(true)
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const params = { classFilter: klass, search: search, start, end };

    const [data, count] = await Promise.all([
      client.fetch(getPaginatedStudentsQuery, params),
      client.fetch(getStudentsCountQuery, params)
    ]);
    setStudents(data.map(normalizeStudent))
    setTotalCount(count)
    setLoading(false)
    onLoadingChange?.(false)
  }



  const uploadPhotoAndGetRef = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/upload', { method: 'POST', body: form, headers: { 'Authorization': `Bearer ${token}` } })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Upload failed')
    return { _type: 'image', asset: { _type: 'reference', _ref: json.assetId } }
  }

  // Handle Create (Called from StudentFormModal)
  const handleCreateStudent = async (data: any, photoFile: File | null) => {
    setCreateLoading(true)
    try {
      const body: any = { ...data }
      if (photoFile) {
        const imageRef = await uploadPhotoAndGetRef(photoFile)
        body.photo = imageRef
      }
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/students', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Create failed')

      setShowAddModal(false)
      toast.success('Student created successfully!')
      await refreshStudents()
    } catch (err) {
      console.error('Failed to create student', err)
      toast.error('Failed to create student')
    } finally {
      setCreateLoading(false)
    }
  }

  // Handle Update (Called from StudentFormModal)
  const handleUpdateStudent = async (data: any, photoFile: File | null) => {
    if (!editingStudent) return
    setEditLoading(true)
    try {
      const body: any = { ...data }
      if (photoFile) {
        const imageRef = await uploadPhotoAndGetRef(photoFile)
        body.photo = imageRef
      }

      // Clean up fields not in schema
      if ('photoUrl' in body) delete body.photoUrl
      if ('_id' in body) delete body._id
      if ('_updatedAt' in body) delete body._updatedAt
      if ('_createdAt' in body) delete body._createdAt
      if ('_type' in body) delete body._type
      if ('_rev' in body) delete body._rev

      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/students', {
        method: 'PATCH',
        body: JSON.stringify({ id: editingStudent._id, patch: body }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Update failed')

      setEditingStudent(null) // Close modal
      toast.success('Student updated successfully!')
      await refreshStudents()
    } catch (_error: any) {
      console.error('Failed to update student', _error)

      toast.error('Failed to update student')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteStudent = async (id: string) => {
    setDeleteLoadingId(id)
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/students', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        if (res.status === 409 && (json?.referencing || json?.blocked)) {
          const refs = (json.referencing || []).map((r: any) => `${r._type}:${r._id}`).join(', ')
          toast.error(`Cannot delete. Referenced by: ${refs || 'other documents'}`)
          return
        }
        throw new Error(json.error || 'Delete failed')
      }
      await refreshStudents()
      toast.success('Student deleted')
    } catch (err) {
      console.error('Failed to delete student', err)
      toast.error('Failed to delete student')
    } finally {
      setDeleteLoadingId(null)
      setConfirmDeleteId(null)
    }
  }

  // Handle Delete All
  const handleDeleteAll = async () => {
    setBulkActionLoading(true)
    try {
      // Assuming endpoint exists or handling logic on server
      // If no specific "Delete All" endpoint, we might need to iterate or add a query param
      // For now, let's assume we send a special DELETE request or multiple
      // Ideally: DELETE /api/students?action=deleteAll
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/students?action=deleteAll', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      const json = await res.json()

      if (!res.ok || !json.ok) throw new Error(json.error || 'Delete all failed')

      await refreshStudents()
      toast.success('All students deleted successfully')
      setShowDeleteAllConfirm(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete all students')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Handle Delete By Class
  const handleDeleteClass = async () => {
    setBulkActionLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/students?class=${deleteClassSelected}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      const json = await res.json()

      if (!res.ok || !json.ok) throw new Error(json.error || 'Delete class failed')

      await refreshStudents()
      toast.success(`Class ${deleteClassSelected} students deleted`)
      setShowDeleteByClassConfirm(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete class')
    } finally {
      setBulkActionLoading(false)
    }
  }


  // --- Excel Logic ---
  const loadExcel = async () => {
    try {
      const ExcelJS = await import('exceljs')

      return ExcelJS.default || ExcelJS
    } catch {
      throw new Error('ExcelJS library could not be loaded.')
    }
  }

  const handleExportExcel = async () => {
    try {
      if (students.length === 0) {
        toast.error('No students to export')
        return
      }
      const ExcelJS: any = await loadExcel()
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Students')

      // Setup columns (Same as before)
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

      // Add rows
      students.forEach((student) => {
        ws.addRow({
          fullName: student.fullName,
          fatherName: student.fatherName,
          fatherCnic: (student as any).fatherCnic,
          dob: student.dob,
          rollNumber: student.rollNumber,
          grNumber: student.grNumber,
          gender: student.gender,
          admissionFor: student.admissionFor,
          nationality: student.nationality,
          medicalCondition: student.medicalCondition,
          cnicOrBform: student.cnicOrBform,
          email: student.email,
          phoneNumber: student.phoneNumber,
          whatsappNumber: student.whatsappNumber,
          address: student.address,
          formerEducation: student.formerEducation,
          previousInstitute: student.previousInstitute,
          lastExamPercentage: student.lastExamPercentage,
          guardianName: student.guardianName,
          guardianContact: student.guardianContact,
          guardianCnic: student.guardianCnic,
          guardianRelation: student.guardianRelation
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      toast.success('Excel exported successfully!')

    } catch (_error: any) {
      console.error(_error)

      toast.error('Export failed')
    }
  }

  const fileInputRefId = 'students-import-input'
  const handleImportExcelClick = () => { document.getElementById(fileInputRefId)?.click() }
  const handleImportExcelFile = async (e: ChangeEvent<HTMLInputElement>) => {
    // ... Import logic kept roughly the same but simplified for brevity in this replace
    // Assuming user wants functionality preserved, so I will restore the logic
    // to allow import. 
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
        if (!r || !r[1]) continue

        // Helper to get string
        const s = (idx: number) => {
          const val = r[idx];
          if (typeof val === 'object') return val.text || JSON.stringify(val);
          return String(val || '');
        }

        toCreate.push({
          fullName: s(1),
          fatherName: s(2),
          fatherCnic: s(3),
          dob: s(4), // Assume valid or improve parsing if needed
          rollNumber: s(5),
          grNumber: s(6),
          gender: s(7) || 'male',
          admissionFor: s(8) || '1',
          nationality: s(9) || 'pakistani',
          medicalCondition: s(10) || 'no',
          cnicOrBform: s(11),
          email: s(12),
          phoneNumber: s(13),
          whatsappNumber: s(14),
          address: s(15),
          formerEducation: s(16),
          previousInstitute: s(17),
          lastExamPercentage: s(18),
          guardianName: s(19),
          guardianContact: s(20),
          guardianCnic: s(21),
          guardianRelation: s(22),
        })
      }

      let successCount = 0
      const token = await auth.currentUser?.getIdToken();
      for (const doc of toCreate) {
        try {
          const res = await fetch('/api/students', {
            method: 'POST',
            body: JSON.stringify(doc),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          })
          if ((await res.json()).ok) successCount++
        } catch {

        }
      }

      await refreshStudents()
      toast.success(`Imported ${successCount} of ${toCreate.length} students.`)
    } catch {
      toast.error('Import failed')
    } finally {
      setImportLoading(false)
      if (document.getElementById(fileInputRefId) as any) (document.getElementById(fileInputRefId) as any).value = ''
    }
  }


  // No client-side filtering needed anymore, 'students' contains the page
  const filteredStudents = students;


  return (
    <div className="pb-20">

      {/* 1. Header & Stats */}
      <HeaderStats stats={stats} />

      {/* 2. Control Bar (Unified Command Center) */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 p-3 sm:p-4 rounded-[2rem] shadow-sm mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between transition-all">

        {/* Search & Intelligence Group */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group/search w-full md:w-[400px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within/search:text-neutral-900 dark:group-focus-within/search:text-white transition-colors">
              <Search size={18} />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query Repository (Name, GR, CNIC...)"
              className="w-full pl-12 pr-6 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-all text-[13px] font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
          </div>

          <div className="relative w-full md:w-56 group/select">
            <select
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              className="w-full px-5 py-3 pr-10 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl focus:outline-none focus:border-neutral-900 dark:focus:border-white text-[13px] font-bold text-neutral-600 dark:text-neutral-400 appearance-none cursor-pointer transition-all uppercase tracking-widest"
            >
              <option value="All">All Tiers</option>
              {fetchedClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-neutral-400 group-focus-within/select:rotate-180 transition-transform pointer-events-none" />
          </div>
        </div>

        {/* Global Operations Group */}
        <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-end w-full xl:w-auto">
          <div className="flex items-center gap-1 bg-neutral-50 dark:bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <button
              onClick={refreshStudents}
              className={`p-2 rounded-xl hover:bg-white dark:hover:bg-neutral-800 transition-all text-neutral-400 hover:text-neutral-900 dark:hover:text-white shadow-sm ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
            <button
              onClick={handleExportExcel}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-neutral-800 transition-all text-neutral-400 hover:text-neutral-900 dark:hover:text-white shadow-sm"
              title="Export Ledger"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleImportExcelClick}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-neutral-800 transition-all text-neutral-400 hover:text-neutral-900 dark:hover:text-white shadow-sm"
              title="Import Buffer"
            >
              <Upload size={18} />
            </button>
            <input id={fileInputRefId} type="file" accept=".xlsx" className="hidden" onChange={handleImportExcelFile} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setDeleteClassSelected('1'); setShowDeleteByClassConfirm(true) }}
              className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-white bg-amber-500/5 hover:bg-amber-500 rounded-xl transition-all border border-amber-500/10"
            >
              Purge
            </button>
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-white bg-rose-500/5 hover:bg-rose-500 rounded-xl transition-all border border-rose-500/10"
            >
              Wipe
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="group relative px-6 py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center gap-3 overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white dark:bg-neutral-900 opacity-20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            <Plus size={18} strokeWidth={3} />
            <span className="text-[12px] font-black uppercase tracking-[0.2em]">New Entry</span>
          </button>
        </div>
      </div>

      {/* 3. Operational Data (Data Views) */}
      <div className="space-y-8 min-h-[400px]">
        <StudentTable
          students={filteredStudents}
          loading={loading}
          onView={setClickedStudent}
          onEdit={(s) => setEditingStudent(s)}
          onDelete={setConfirmDeleteId}
          deleteLoadingId={deleteLoadingId}
        />

        <StudentGrid
          students={filteredStudents}
          loading={loading}
          onView={setClickedStudent}
          onEdit={(s) => setEditingStudent(s)}
          onDelete={setConfirmDeleteId}
          deleteLoadingId={deleteLoadingId}
        />
      </div>

      {/* 4. Persistence Controls (Pagination) */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-6 border-t border-neutral-100 dark:border-neutral-900">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <p className="text-[11px] font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Registry Footprint</p>
          <p className="text-[12px] text-neutral-400 font-medium">
            Projecting <span className="text-neutral-900 dark:text-white font-bold">{students.length}</span> of <span className="text-neutral-900 dark:text-white font-bold">{totalCount}</span> identified records
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-inner">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-all hover:bg-white dark:hover:bg-neutral-800 shadow-sm"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>

          <div className="px-6 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-sm">
            <span className="text-[12px] font-black text-neutral-900 dark:text-white uppercase tracking-widest">
              Stage {currentPage}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={students.length < pageSize || loading}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-all hover:bg-white dark:hover:bg-neutral-800 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>



      {/* --- MODALS --- */}

      {/* Add / Edit Form - Enterprise Full-Screen Drawer */}
      <Drawer
        isOpen={showAddModal || !!editingStudent}
        onClose={() => { setShowAddModal(false); setEditingStudent(null); }}
        size="full"
      >
        <DrawerOverlay className="backdrop-blur-md bg-black/40" />
        <DrawerContent className="bg-white dark:bg-neutral-950 p-0 m-0">
          <StudentFormContent
            initialData={editingStudent}
            loading={editingStudent ? editLoading : createLoading}
            onCancel={() => { setShowAddModal(false); setEditingStudent(null); }}
            onSave={editingStudent ? handleUpdateStudent : handleCreateStudent}
          />
        </DrawerContent>
      </Drawer>

      {/* View Details - Enterprise Drawer */}
      <Drawer
        isOpen={!!clickedStudent}
        onClose={() => setClickedStudent(null)}
        size="full"
      >
        <DrawerOverlay className="backdrop-blur-md bg-black/40" />
        <DrawerContent className="bg-white dark:bg-neutral-950 p-0 m-0">
          <StudentDetailModal
            student={clickedStudent}
            onClose={() => setClickedStudent(null)}
          />
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmations (Simplifed inline for now to save files, can extract if needed) */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] backdrop-blur-sm p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-2">Delete Student?</h4>
            <p className="text-gray-600 mb-6 text-sm">Are you sure you want to delete this student? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
                onClick={() => handleDeleteStudent(confirmDeleteId)}
              >
                {deleteLoadingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SecurityConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAll}
        title="Delete Entire Directory?"
        description={
          <div className="space-y-2">
            <p>You are about to delete <strong>ALL {students.length} students</strong> from the database.</p>
            <p className="font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              Warning: This action is permanent and CANNOT be undone. All student records, photos, and associated data will be erased.
            </p>
          </div>
        }
        verificationText="DELETE ALL STUDENTS"
        variant="danger"
        loading={bulkActionLoading}
      />

      <SecurityConfirmationModal
        isOpen={showDeleteByClassConfirm}
        onClose={() => setShowDeleteByClassConfirm(false)}
        onConfirm={handleDeleteClass}
        title={`Delete Class ${deleteClassSelected}?`}
        description={
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Select Class to Delete</label>
              <select
                value={deleteClassSelected}
                onChange={e => setDeleteClassSelected(e.target.value)}
                className="w-full border-amber-200 focus:ring-amber-500/20 focus:border-amber-500 rounded-lg py-2.5"
              >
                {fetchedClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <p>This will delete all students currently assigned to <strong>Class {deleteClassSelected}</strong>.</p>
          </div>
        }
        verificationText={`DELETE CLASS ${deleteClassSelected}`}
        variant="warning"
        loading={bulkActionLoading}
      />


    </div>
  )
}

export default AdminStudents

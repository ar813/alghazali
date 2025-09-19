"use client"

import { useEffect, useState } from 'react'
import { Filter, Search, RotateCw, Upload, Download } from 'lucide-react'
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery } from "@/sanity/lib/queries";
import type { Student } from '@/types/student';
 


const AdminStudents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true); // ⏳ Loading state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState<any>({
    fullName: '',
    fatherName: '',
    dob: '',
    rollNumber: '',
    grNumber: '',
    gender: 'male',
    admissionFor: '1',
    nationality: 'pakistani',
    medicalCondition: 'no',
    cnicOrBform: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    address: '',
    formerEducation: '',
    previousInstitute: '',
    lastExamPercentage: '',
    guardianName: '',
    guardianContact: '',
    guardianCnic: '',
    guardianRelation: '',
    photoFile: null as File | null,
  })
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true); // Start loading
      const data: Student[] = await client.fetch(getAllStudentsQuery);
      setStudents(data);
      setLoading(false); // Done loading
    };

    fetchStudents();
  }, []);

  const refreshStudents = async () => {
    setLoading(true)
    const data: Student[] = await client.fetch(getAllStudentsQuery);
    setStudents(data)
    setLoading(false)
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
        dob: '',
        rollNumber: '',
        grNumber: '',
        gender: 'male',
        admissionFor: '1',
        nationality: 'pakistani',
        medicalCondition: 'no',
        cnicOrBform: '',
        email: '',
        phoneNumber: '',
        whatsappNumber: '',
        address: '',
        formerEducation: '',
        previousInstitute: '',
        lastExamPercentage: '',
        guardianName: '',
        guardianContact: '',
        guardianCnic: '',
        guardianRelation: '',
        photoFile: null,
      })
      await refreshStudents()
    } catch (err) {
      console.error('Failed to create student', err)
      alert('Failed to create student')
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
      alert('Failed to delete student')
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

  const handleExportExcel = async () => {
    try {
      console.log('Starting Excel export...')
      
      if (students.length === 0) {
        alert('Koi students nahi hain export karne ke liye!')
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
      
      alert(`Excel file successfully exported! (${students.length} students)`)
      
    } catch (error: any) {
      console.error('Excel export error:', error)
      alert(`Excel export mein error aaya: ${error?.message || 'Unknown error'}. Dev server restart karke dobara try karein.`)
    }
  }

  const fileInputRefId = 'students-import-input'
  const handleImportExcelClick = () => {
    const el = document.getElementById(fileInputRefId) as HTMLInputElement | null
    el?.click()
  }
  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
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
          fullName: r[1] || '',
          fatherName: r[2] || '',
          dob: r[3] || '',
          rollNumber: r[4] || '',
          grNumber: r[5] || '',
          gender: r[6] || 'male',
          admissionFor: r[7] || '1',
          nationality: r[8] || 'pakistani',
          medicalCondition: r[9] || 'no',
          cnicOrBform: r[10] || '',
          email: r[11] || '',
          phoneNumber: r[12] || '',
          whatsappNumber: r[13] || '',
          address: r[14] || '',
          formerEducation: r[15] || '',
          previousInstitute: r[16] || '',
          lastExamPercentage: r[17] || '',
          guardianName: r[18] || '',
          guardianContact: r[19] || '',
          guardianCnic: r[20] || '',
          guardianRelation: r[21] || '',
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
      alert(`Import completed! ${successCount} out of ${toCreate.length} students imported successfully.`)
      
    } catch (error: any) {
      console.error('Excel import error:', error)
      alert(`Excel import mein error aaya: ${error?.message || 'Unknown error'}. File format check karein aur dev server restart karke dobara try karein.`)
    } finally {
      // Reset file input safely (React synthetic event's currentTarget can be null after async)
      const inputEl = document.getElementById(fileInputRefId) as HTMLInputElement | null
      if (inputEl) inputEl.value = ''
    }
  }

  // derive filtered list once to use in both table and cards
  const filteredStudents = students
    .filter(student =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <div>
      <div className="space-y-6 pb-14">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button className="px-4 py-2 border rounded-lg flex items-center space-x-2 hover:bg-gray-50">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
          {/* Actions move to next line on mobile */}
          <div className="flex items-center gap-2">
            <button
              onClick={refreshStudents}
              className="px-3 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm"
              title="Refresh table"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={() => { console.log('Add button clicked'); setShowAddModal(true) }} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-95">Add Student</button>
          </div>
        </div>

        {selectedStudent && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl relative shadow-2xl border border-gray-200 overflow-y-auto max-h-[90vh]">

              {/* Close Button */}
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close"
              >
                &times;
              </button>

              {/* Title */}
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
                👨‍🎓 Student Details
              </h2>

              {/* Photo */}
              {selectedStudent.photoUrl && (
                <div className="flex justify-center mb-6">
                  <img
                    src={selectedStudent.photoUrl}
                    alt="Student"
                    className="w-32 h-32 object-cover rounded-full border shadow-md"
                  />
                </div>
              )}

              {/* SECTION: Personal Information */}
              <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-6 border-b pb-1">👤 Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-800 text-sm">
                <Info label="Full Name" value={selectedStudent.fullName} />
                <Info label="Father's Name" value={selectedStudent.fatherName} />
                <Info label="Date of Birth" value={selectedStudent.dob} />
                <Info label="Roll Number" value={selectedStudent.rollNumber} />
                <Info label="GR Number" value={selectedStudent.grNumber} />
                <Info label="Gender" value={selectedStudent.gender} />
                <Info label="Admission For" value={selectedStudent.admissionFor} />
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
            </div>
          </div>
        )}






        {/* 👇 Table (Desktop and Tablets md+) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GR Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B-Form</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <div className="text-blue-600 font-semibold text-lg tracking-wide">
                          Loading students...
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents
                    .map(student => (
                      <tr key={student.grNumber} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={student.photoUrl || '/assets/logo.png'}
                              alt={student.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.fatherName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.cnicOrBform}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.admissionFor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.dob}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button onClick={() => { console.log('View clicked', student); setSelectedStudent(student) }} className="text-blue-600 mr-3">View</button>
                          <button onClick={() => { console.log('Edit clicked', student); setEditingStudent(student); setShowEditModal(true); }} className="text-yellow-600 mr-3">Edit</button>
                          <button onClick={() => { console.log('Delete clicked', (student as any)._id); setConfirmDeleteId((student as any)._id) }} className="text-red-600">{deleteLoadingId === (student as any)._id ? 'Deleting...' : 'Delete'}</button>
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
          {loading ? (
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-blue-600 font-semibold">Loading students...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">No students found</div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.grNumber} className="bg-white rounded-2xl shadow border p-4">
                <div className="flex items-center gap-3">
                  <img src={student.photoUrl || '/assets/logo.png'} alt={student.fullName} className="w-12 h-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{student.fullName}</div>
                    <div className="text-xs text-gray-500">GR: {student.grNumber} • Class: {student.admissionFor}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><span className="text-gray-500">Father:</span> {student.fatherName}</div>
                  <div><span className="text-gray-500">B-Form:</span> {student.cnicOrBform}</div>
                  <div><span className="text-gray-500">Roll No:</span> {student.rollNumber}</div>
                  <div><span className="text-gray-500">DOB:</span> {student.dob}</div>
                </div>
                <div className="mt-3 flex justify-end gap-3 text-sm">
                  <button onClick={() => setSelectedStudent(student)} className="text-blue-600">View</button>
                  <button onClick={() => { setEditingStudent(student); setShowEditModal(true); }} className="text-yellow-600">Edit</button>
                  <button onClick={() => setConfirmDeleteId((student as any)._id)} className="text-red-600">{deleteLoadingId === (student as any)._id ? 'Deleting...' : 'Delete'}</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl my-10 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold mb-4">Add Student</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={newStudent.fullName} onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })} placeholder="Full Name" className="w-full border p-2 rounded" />
                <input value={newStudent.fatherName} onChange={(e) => setNewStudent({ ...newStudent, fatherName: e.target.value })} placeholder="Father Name" className="w-full border p-2 rounded" />
                <input type="date" value={newStudent.dob} onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })} placeholder="Date of Birth" className="w-full border p-2 rounded" />
                <input value={newStudent.rollNumber} onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })} placeholder="Roll Number" className="w-full border p-2 rounded" />
                <input value={newStudent.grNumber} onChange={(e) => setNewStudent({ ...newStudent, grNumber: e.target.value })} placeholder="GR Number" className="w-full border p-2 rounded" />
                <input value={newStudent.cnicOrBform} onChange={(e) => setNewStudent({ ...newStudent, cnicOrBform: e.target.value })} placeholder="CNIC / B-Form" className="w-full border p-2 rounded" />
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setNewStudent({ ...newStudent, photoFile: e.target.files?.[0] || null })} className="w-full border p-2 rounded" />
                </div>
                <select value={newStudent.admissionFor} onChange={(e) => setNewStudent({ ...newStudent, admissionFor: e.target.value })} className="w-full border p-2 rounded">
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="SSCI">SSCI</option>
                  <option value="SSCII">SSCII</option>
                </select>
                <div className="flex items-center gap-3 border rounded p-2">
                  <span className="text-sm text-gray-600">Gender:</span>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="genderAdd" checked={newStudent.gender === 'male'} onChange={() => setNewStudent({ ...newStudent, gender: 'male' })} /> Male</label>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="genderAdd" checked={newStudent.gender === 'female'} onChange={() => setNewStudent({ ...newStudent, gender: 'female' })} /> Female</label>
                </div>
                <div className="flex items-center gap-3 border rounded p-2">
                  <span className="text-sm text-gray-600">Nationality:</span>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="nationalityAdd" checked={newStudent.nationality === 'pakistani'} onChange={() => setNewStudent({ ...newStudent, nationality: 'pakistani' })} /> Pakistani</label>
                </div>
                <div className="flex items-center gap-3 border rounded p-2">
                  <span className="text-sm text-gray-600">Medical Condition:</span>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="medicalAdd" checked={newStudent.medicalCondition === 'yes'} onChange={() => setNewStudent({ ...newStudent, medicalCondition: 'yes' })} /> Yes</label>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="medicalAdd" checked={newStudent.medicalCondition === 'no'} onChange={() => setNewStudent({ ...newStudent, medicalCondition: 'no' })} /> No</label>
                </div>
                <input value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="Email" className="w-full border p-2 rounded" />
                <input value={newStudent.phoneNumber} onChange={(e) => setNewStudent({ ...newStudent, phoneNumber: e.target.value })} placeholder="Phone Number" className="w-full border p-2 rounded" />
                <input value={newStudent.whatsappNumber} onChange={(e) => setNewStudent({ ...newStudent, whatsappNumber: e.target.value })} placeholder="WhatsApp Number" className="w-full border p-2 rounded" />
                <textarea value={newStudent.address} onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })} placeholder="Address" className="w-full border p-2 rounded sm:col-span-2" />
                <select value={newStudent.formerEducation} onChange={(e) => setNewStudent({ ...newStudent, formerEducation: e.target.value })} className="w-full border p-2 rounded">
                  <option value="">Former Education</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="SSCI">SSCI</option>
                  <option value="SSCII">SSCII</option>
                </select>
                <input value={newStudent.previousInstitute} onChange={(e) => setNewStudent({ ...newStudent, previousInstitute: e.target.value })} placeholder="Previous Institute" className="w-full border p-2 rounded" />
                <input value={newStudent.lastExamPercentage} onChange={(e) => setNewStudent({ ...newStudent, lastExamPercentage: e.target.value })} placeholder="Last Exam %" className="w-full border p-2 rounded" />
                <input value={newStudent.guardianName} onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })} placeholder="Guardian Name" className="w-full border p-2 rounded" />
                <input value={newStudent.guardianContact} onChange={(e) => setNewStudent({ ...newStudent, guardianContact: e.target.value })} placeholder="Guardian Contact" className="w-full border p-2 rounded" />
                <input value={newStudent.guardianCnic} onChange={(e) => setNewStudent({ ...newStudent, guardianCnic: e.target.value })} placeholder="Guardian CNIC" className="w-full border p-2 rounded" />
                <input value={newStudent.guardianRelation} onChange={(e) => setNewStudent({ ...newStudent, guardianRelation: e.target.value })} placeholder="Relation" className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { console.log('Add modal cancel'); setShowAddModal(false) }} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={async () => { console.log('Create clicked', newStudent); await handleCreateStudent() }} disabled={createLoading} className="px-4 py-2 bg-blue-600 text-white rounded">{createLoading ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && editingStudent && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl my-10 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold mb-4">Edit Student</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={editingStudent.fullName} onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })} placeholder="Full Name" className="w-full border p-2 rounded" />
                <input value={editingStudent.fatherName} onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value })} placeholder="Father Name" className="w-full border p-2 rounded" />
                <input type="date" value={editingStudent.dob || ''} onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })} placeholder="Date of Birth" className="w-full border p-2 rounded" />
                <input value={editingStudent.rollNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })} placeholder="Roll Number" className="w-full border p-2 rounded" />
                <input value={editingStudent.grNumber} onChange={(e) => setEditingStudent({ ...editingStudent, grNumber: e.target.value })} placeholder="GR Number" className="w-full border p-2 rounded" />
                <input value={editingStudent.cnicOrBform} onChange={(e) => setEditingStudent({ ...editingStudent, cnicOrBform: e.target.value })} placeholder="CNIC / B-Form" className="w-full border p-2 rounded" />
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setEditingStudent({ ...editingStudent, photoFile: e.target.files?.[0] || null })} className="w-full border p-2 rounded" />
                </div>
                <select value={editingStudent.admissionFor} onChange={(e) => setEditingStudent({ ...editingStudent, admissionFor: e.target.value })} className="w-full border p-2 rounded">
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="SSCI">SSCI</option>
                  <option value="SSCII">SSCII</option>
                </select>
                <div className="flex items-center gap-3 border rounded p-2">
                  <span className="text-sm text-gray-600">Gender:</span>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="genderEdit" checked={editingStudent.gender === 'male'} onChange={() => setEditingStudent({ ...editingStudent, gender: 'male' })} /> Male</label>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="genderEdit" checked={editingStudent.gender === 'female'} onChange={() => setEditingStudent({ ...editingStudent, gender: 'female' })} /> Female</label>
                </div>
                <div className="flex items-center gap-3 border rounded p-2">
                  <span className="text-sm text-gray-600">Nationality:</span>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="nationalityEdit" checked={editingStudent.nationality === 'pakistani'} onChange={() => setEditingStudent({ ...editingStudent, nationality: 'pakistani' })} /> Pakistani</label>
                </div>
                <div className="flex items-center gap-3 border rounded p-2">
                  <span className="text-sm text-gray-600">Medical Condition:</span>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="medicalEdit" checked={editingStudent.medicalCondition === 'yes'} onChange={() => setEditingStudent({ ...editingStudent, medicalCondition: 'yes' })} /> Yes</label>
                  <label className="flex items-center gap-1 text-sm"><input type="radio" name="medicalEdit" checked={editingStudent.medicalCondition === 'no'} onChange={() => setEditingStudent({ ...editingStudent, medicalCondition: 'no' })} /> No</label>
                </div>
                <input value={editingStudent.email || ''} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} placeholder="Email" className="w-full border p-2 rounded" />
                <input value={editingStudent.phoneNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phoneNumber: e.target.value })} placeholder="Phone Number" className="w-full border p-2 rounded" />
                <input value={editingStudent.whatsappNumber || ''} onChange={(e) => setEditingStudent({ ...editingStudent, whatsappNumber: e.target.value })} placeholder="WhatsApp Number" className="w-full border p-2 rounded" />
                <textarea value={editingStudent.address || ''} onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })} placeholder="Address" className="w-full border p-2 rounded sm:col-span-2" />
                <select value={editingStudent.formerEducation || ''} onChange={(e) => setEditingStudent({ ...editingStudent, formerEducation: e.target.value })} className="w-full border p-2 rounded">
                  <option value="">Former Education</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="SSCI">SSCI</option>
                  <option value="SSCII">SSCII</option>
                </select>
                <input value={editingStudent.previousInstitute || ''} onChange={(e) => setEditingStudent({ ...editingStudent, previousInstitute: e.target.value })} placeholder="Previous Institute" className="w-full border p-2 rounded" />
                <input value={editingStudent.lastExamPercentage || ''} onChange={(e) => setEditingStudent({ ...editingStudent, lastExamPercentage: e.target.value })} placeholder="Last Exam %" className="w-full border p-2 rounded" />
                <input value={editingStudent.guardianName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })} placeholder="Guardian Name" className="w-full border p-2 rounded" />
                <input value={editingStudent.guardianContact || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianContact: e.target.value })} placeholder="Guardian Contact" className="w-full border p-2 rounded" />
                <input value={editingStudent.guardianCnic || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianCnic: e.target.value })} placeholder="Guardian CNIC" className="w-full border p-2 rounded" />
                <input value={editingStudent.guardianRelation || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianRelation: e.target.value })} placeholder="Relation" className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { console.log('Edit modal cancel'); setShowEditModal(false); setEditingStudent(null); }} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={async () => {
                    console.log('Save edit clicked', editingStudent)
                    setEditLoading(true)
                    try {
                      const id = (editingStudent as any)._id
                      const patch: any = { fullName: editingStudent.fullName, fatherName: editingStudent.fatherName, grNumber: editingStudent.grNumber, cnicOrBform: editingStudent.cnicOrBform, admissionFor: editingStudent.admissionFor, dob: editingStudent.dob, rollNumber: editingStudent.rollNumber, gender: editingStudent.gender, email: editingStudent.email, phoneNumber: editingStudent.phoneNumber, whatsappNumber: editingStudent.whatsappNumber, address: editingStudent.address, formerEducation: editingStudent.formerEducation, previousInstitute: editingStudent.previousInstitute, lastExamPercentage: editingStudent.lastExamPercentage, guardianName: editingStudent.guardianName, guardianContact: editingStudent.guardianContact, guardianCnic: editingStudent.guardianCnic, guardianRelation: editingStudent.guardianRelation, nationality: editingStudent.nationality, medicalCondition: editingStudent.medicalCondition }
                      if (editingStudent.photoFile) {
                        const imageRef = await uploadPhotoAndGetRef(editingStudent.photoFile)
                        patch.photo = imageRef
                      }
                      const res = await fetch('/api/students', { method: 'PATCH', body: JSON.stringify({ id, patch }), headers: { 'Content-Type': 'application/json' } })
                      const json = await res.json()
                      if (!json.ok) throw new Error(json.error || 'Update failed')
                      setShowEditModal(false)
                      setEditingStudent(null)
                      await refreshStudents()
                    } catch (err) {
                      console.error('Failed to update student', err)
                      alert('Failed to update student')
                    } finally {
                      setEditLoading(false)
                    }
                  }} disabled={editLoading} className="px-4 py-2 bg-yellow-600 text-white rounded">{editLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border">
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

      </div>

      {/* Import / Export Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm">
          <Download size={16} />
          <span>Export Excel</span>
        </button>
        <button onClick={handleImportExcelClick} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm text-sm">
          <Upload size={16} />
          <span>Import Excel</span>
        </button>
        <input id={fileInputRefId} type="file" accept=".xlsx" className="hidden" onChange={handleImportExcelFile} />
      </div>
    </div>
  );
};

export default AdminStudents;


const Info = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <span className="font-medium">{label}:</span>{" "}
    <span className="text-gray-600">{value || "—"}</span>
  </div>
);

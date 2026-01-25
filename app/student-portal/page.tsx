'use client';

import { useEffect, useState, useMemo } from 'react'
import { CalendarCheck, GraduationCap, LayoutDashboard, Megaphone, User, LogOut, QrCode } from 'lucide-react';
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery, getScheduleByClassQuery } from "@/sanity/lib/queries";
import type { Student } from '@/types/student';
import { X } from 'lucide-react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useRouter } from 'next/navigation';

import NavBar from '@/components/NavBar/NavBar';
import StudentDashboard from '@/components/StudentDashboard/StudentDashboard';
import StudentProfile from '@/components/StudentProfile/StudentProfile';
import StudentSchedule from '@/components/StudentSchedule/StudentSchedule';
import StudentNotices from '@/components/StudentNotices/StudentNotices';
import StudentCard from '@/components/StudentCard/StudentCard';
import StudentFees from '@/components/StudentFees/StudentFees';
import StudentQuizzes from '@/components/StudentQuizzes/StudentQuizzes';
import StudentResults from '@/components/StudentResults/StudentResults';

// Helpers: CNIC formatting and normalization
const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '').slice(0, 13)
const formatCnic = (s: string) => {
  const d = onlyDigits(s)
  const p1 = d.slice(0, 5)
  const p2 = d.slice(5, 12)
  const p3 = d.slice(12, 13)
  if (d.length <= 5) return p1
  if (d.length <= 12) return `${p1}-${p2}`
  return `${p1}-${p2}-${p3}`
}

export default function StylishStudentPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const router = useRouter();

  // ***************************************************************************************
  type ScheduleDay = { day: string; periods?: { subject: string; time: string }[] }
  const [filtered, setFiltered] = useState<Student[]>([])
  const [matchedSchedule, setMatchedSchedule] = useState<ScheduleDay[] | null>(null)
  const [showModal, setShowModal] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [sessionData, setSessionData] = useState<{ bFormOrCnic: string; grNumber: string } | null>(null)
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [searchBFormNumber, setSearchBFormNumber] = useState('')
  const [searchGRNumber, setSearchGRNumber] = useState('')
  const [validationMessage, setValidationMessage] = useState('');
  const sessionDuration = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await client.fetch(getAllStudentsQuery);
      setStudents(data);
      setStudentsLoaded(true)
    };

    fetchStudents();
  }, []);

  // Check existing session immediately on mount (admin-like behavior)
  useEffect(() => {
    try {
      const session = localStorage.getItem('studentSession')
      if (!session) {
        setIsLoading(false)
        return
      }
      const { timestamp, bFormOrCnic, grNumber } = JSON.parse(session)
      const now = Date.now()
      if (now - timestamp < sessionDuration) {
        // Valid session: hide modal immediately and wait for students to load
        setSessionData({ bFormOrCnic, grNumber })
        setShowModal(false)
        setIsLoading(true)
      } else {
        localStorage.removeItem('studentSession')
        setIsLoading(false)
      }
    } catch {
      setIsLoading(false)
    }
  }, [sessionDuration])

  // Once students load and we have a valid session, match the student
  useEffect(() => {
    if (!sessionData) return
    if (students.length === 0) return
    const { bFormOrCnic, grNumber } = sessionData
    const target = onlyDigits(String(bFormOrCnic))
    const result = students.filter((s: Student) => {
      const docId = onlyDigits(String((s as any).cnicOrBform ?? ''))
      const guardian = onlyDigits(String((s as any).guardianCnic ?? ''))
      const father = onlyDigits(String((s as any).fatherCnic ?? ''))
      const gr = String((s as any).grNumber ?? '').trim()
      return (docId === target || guardian === target || father === target) && gr === grNumber
    })
    if (result.length > 0) {
      setFiltered(result)
      setShowModal(false)
      setIsLoading(false)
      // persist studentId for quiz submission page
      try { localStorage.setItem('studentId', String(result[0]!._id)) } catch { }
    } else {
      // Session didn't match any student (data changed). Clear and show modal
      try { localStorage.removeItem('studentSession') } catch { }
      setSessionData(null)
      setFiltered([])
      setShowModal(true)
      setIsLoading(false)
    }
  }, [students, sessionData])

  const handleSearch = () => {
    const bForm = onlyDigits(searchBFormNumber);
    const grNo = searchGRNumber.trim();

    if (!bForm || !grNo) {
      setValidationMessage('Please fill in both CNIC/B-Form and GR Number fields.');
      return;
    }

    const result = students.filter((s: Student) => {
      const docId = onlyDigits(String((s as any).cnicOrBform ?? ''))
      const guardian = onlyDigits(String((s as any).guardianCnic ?? ''))
      const father = onlyDigits(String((s as any).fatherCnic ?? ''))
      const gr = String((s as any).grNumber ?? '').trim()
      return (docId === bForm || guardian === bForm || father === bForm) && gr === grNo
    });

    if (result.length === 0) {
      setValidationMessage('No student found with the provided details.');
    } else {
      setFiltered(result);
      setShowModal(false);
      setValidationMessage('');
      // Save session
      const payload = { timestamp: Date.now(), bFormOrCnic: bForm, grNumber: grNo }
      localStorage.setItem('studentSession', JSON.stringify(payload))
      setSessionData({ bFormOrCnic: bForm, grNumber: grNo })
      // also persist studentId for quiz submission
      try { localStorage.setItem('studentId', String(result[0]!._id)) } catch { }
    }
  };

  // When filtered student changes (verification done), fetch the schedule for their class
  useEffect(() => {
    if (filtered.length === 0) return
    const studentClass = filtered[0].admissionFor
    if (!studentClass) {
      setMatchedSchedule(null)
      return
    }
    let mounted = true
    setScheduleLoading(true)
    client.fetch(getScheduleByClassQuery(studentClass))
      .then((sch: { days?: ScheduleDay[] } | null) => { if (!mounted) return; if (sch && sch.days) setMatchedSchedule(sch.days); else setMatchedSchedule(null) })
      .catch(() => { if (!mounted) return; setMatchedSchedule(null) })
      .finally(() => { if (!mounted) return; setScheduleLoading(false) })
    return () => { mounted = false }
  }, [filtered])



  const sidebarItems = useMemo(() => [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Profile', label: 'Profile', icon: User },
    { id: 'Schedule', label: 'Schedule', icon: CalendarCheck },
    { id: 'Fees', label: 'Fees', icon: GraduationCap },
    { id: 'ID Card', label: 'ID Card', icon: QrCode },
    { id: 'Notices', label: 'Notices', icon: Megaphone },
    { id: 'Quiz', label: 'Quiz', icon: GraduationCap },
    { id: 'Quiz Result', label: 'Quiz Result', icon: GraduationCap },
  ], []);

  const shouldShowLoader = isLoading || !studentsLoaded || (activeTab === 'Schedule' && scheduleLoading)
  if (shouldShowLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 px-4">
          <div className="relative bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm mx-4">

            <button
              onClick={() => router.push('/')}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Student Verification</h2>
              <p className="text-xs text-gray-500 mt-1">Enter CNIC/B-Form and GR Number to access your portal.</p>
            </div>
            {validationMessage && (
              <div className="mb-3 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <svg className="w-5 h-5 mt-0.5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.658-1.14 1.105-2.05L13.105 4.05c-.553-.91-1.658-.91-2.211 0L4.977 17.95c-.553.91.051 2.05 1.105 2.05z" />
                </svg>
                <span>{validationMessage}</span>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC/B-Form Number</label>
                <input
                  type="text"
                  placeholder="xxxxx-xxxxxxx-x"
                  value={searchBFormNumber}
                  onChange={(e) => setSearchBFormNumber(formatCnic(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Enter student CNIC/B-Form or Guardian/Father CNIC.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GR Number</label>
                <input
                  type="text"
                  placeholder="e.g. 12345"
                  value={searchGRNumber}
                  onChange={(e) => setSearchGRNumber(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-95 transition-all shadow"
              >
                Verify
              </button>
            </form>

          </div>
        </div>
      )}

      <NavBar />

      <div className="min-h-screen flex bg-white transition-all duration-300">

        {/* NEW Sidebar */}
        <Sidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id);
            if (typeof window !== 'undefined') window.location.hash = id;
          }}
        />

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 mt-20 md:mt-0">
          <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 capitalize">
                  {activeTab}
                </h2>
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              {activeTab === 'Dashboard' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { try { localStorage.removeItem('studentSession'); } catch { } window.location.href = '/student-portal'; }}
                    className="px-4 py-2 rounded-lg bg-white text-red-600 hover:bg-red-50 border border-red-100 transition-colors shadow-sm text-sm font-medium inline-flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-gray-600 mt-12 sm:mt-20 flex flex-col items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <span className="text-base sm:text-lg">No Student Found</span>
              </div>
            ) : (
              <div className="mb-16 md:mb-0">
                {activeTab === 'Dashboard' && <StudentDashboard data={filtered[0]} />}
                {activeTab === 'Profile' && <StudentProfile student={filtered[0]} />}
                {activeTab === 'Schedule' && <StudentSchedule schedule={matchedSchedule} />}
                {activeTab === 'Notices' && <StudentNotices studentId={String(filtered[0]!._id)} className={String(filtered[0]!.admissionFor || '')} />}
                {activeTab === 'Quiz' && <StudentQuizzes studentId={String(filtered[0]!._id)} className={String(filtered[0]!.admissionFor || '')} />}
                {activeTab === 'Quiz Result' && <StudentResults studentId={String(filtered[0]!._id)} />}
                {activeTab === 'Fees' && <StudentFees studentId={String(filtered[0]!._id)} />}
                {activeTab === 'ID Card' && <StudentCard student={filtered[0]} />}
              </div>
            )}

          </div>
        </main>

      </div>

    </div>
  );
}

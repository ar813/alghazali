'use client';

import { useEffect, useState } from 'react'
import { BookOpen, CalendarCheck, GraduationCap, LayoutDashboard, Megaphone, User, ChevronLeft, ChevronRight, LogOut, QrCode } from 'lucide-react';
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery, getScheduleByClassQuery } from "@/sanity/lib/queries";
import type { Student } from '@/types/student';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Footer from '@/components/Footer/Footer';
import NavBar from '@/components/NavBar/NavBar';
import StudentDashboard from '@/components/StudentDashboard/StudentDashboard';
import StudentProfile from '@/components/StudentProfile/StudentProfile';
import StudentSubjects from '@/components/StudentSubjects/StudentSubjects';
import StudentSchedule from '@/components/StudentSchedule/StudentSchedule';
import StudentNotices from '@/components/StudentNotices/StudentNotices';
import StudentCard from '@/components/StudentCard/StudentCard';
import StudentFees from '@/components/StudentFees/StudentFees';


export default function StylishStudentPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [collapsed, setCollapsed] = useState(false);
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
  }, [])

  // Once students load and we have a valid session, match the student
  useEffect(() => {
    if (!sessionData) return
    if (students.length === 0) return
    const { bFormOrCnic, grNumber } = sessionData
    const result = students.filter((s: Student) => {
      const docId = String((s as any).cnicOrBform ?? '').trim()
      const guardian = String((s as any).guardianCnic ?? '').trim()
      const gr = String((s as any).grNumber ?? '').trim()
      return (docId === bFormOrCnic || guardian === bFormOrCnic) && gr === grNumber
    })
    if (result.length > 0) {
      setFiltered(result)
      setShowModal(false)
      setIsLoading(false)
    } else {
      // Session didn't match any student (data changed). Clear and show modal
      try { localStorage.removeItem('studentSession') } catch {}
      setSessionData(null)
      setFiltered([])
      setShowModal(true)
      setIsLoading(false)
    }
  }, [students, sessionData])

  const handleSearch = () => {
    const bForm = searchBFormNumber.trim();
    const grNo = searchGRNumber.trim();

    if (!bForm || !grNo) {
      setValidationMessage('Please fill in both CNIC/B-Form and GR Number fields.');
      return;
    }

    const result = students.filter((s: Student) => {
      const docId = String((s as any).cnicOrBform ?? '').trim()
      const guardian = String((s as any).guardianCnic ?? '').trim()
      const gr = String((s as any).grNumber ?? '').trim()
      return (docId === bForm || guardian === bForm) && gr === grNo
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



  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Profile', icon: User },
    { name: 'Subjects', icon: BookOpen },
    { name: 'Schedule', icon: CalendarCheck },
    { name: 'Fees', icon: GraduationCap },
    { name: 'ID Card', icon: QrCode },
    { name: 'Notices', icon: Megaphone },
  ] as const

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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 px-4 sm:px-0">
          <div className="relative bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm mx-4">

            <button
              onClick={() => router.push('/')}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
              aria-label="Close popup"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 text-center">
              Student Verification
            </h2>
            <input
              type="text"
              placeholder="CNIC/B-Form Number"
              value={searchBFormNumber}
              onChange={(e) => setSearchBFormNumber(e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm sm:text-base mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="GR Number"
              value={searchGRNumber}
              onChange={(e) => setSearchGRNumber(e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm sm:text-base mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Search
              </button>
            </div>
            {validationMessage && (
              <div className="mb-4 mt-4 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-sm transform transition-all duration-300 ease-out opacity-100 translate-y-0">
                <svg
                  className="w-5 h-5 mt-0.5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.658-1.14 1.105-2.05L13.105 4.05c-.553-.91-1.658-.91-2.211 0L4.977 17.95c-.553.91.051 2.05 1.105 2.05z"
                  />
                </svg>
                <span>{validationMessage}</span>
              </div>
            )}

          </div>
        </div>
      )}

      <NavBar />

      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex md:hidden z-10">
          <nav className="flex w-full px-2 py-2 items-center overflow-x-auto gap-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {sidebarItems.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`flex-[0_0_20%] shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-lg ${
                  activeTab === name
                    ? `text-blue-600`
                    : 'text-gray-600'
                }`}
              >
                <Icon size={20} className={activeTab === name ? 'scale-110' : ''} />
                <span className="text-xs font-medium">{name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar - Desktop */}
        <aside className={`transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} bg-white/80 backdrop-blur-xl shadow-2xl hidden md:flex flex-col border-r border-white/20`}>
          {/* Toggle Button */}
          <div className="flex justify-end p-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-gray-800 transition-all"
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Logo */}
          <div className={`p-6 text-center border-b border-gray-200/50 pt-6 transition-all duration-300 ${collapsed ? 'pt-0' : 'pt-6'}`}>
            {!collapsed && (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <GraduationCap size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Student Portal
                </h1>
                <p className="text-sm text-gray-500 mt-1">Academic Excellence Hub</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {sidebarItems.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`group flex items-center w-full gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] ${activeTab === name
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <Icon size={20} className={`transition-transform duration-300 ${activeTab === name ? 'scale-110' : 'group-hover:scale-105'}`} />
                {!collapsed && <span className="font-medium">{name}</span>}
                {activeTab === name && !collapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>

          {/* removed logout from sidebar; moved to header */}
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 overflow-auto">
          <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            <div className="mb-6 sm:mb-8 pt-4 sm:pt-8 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  {activeTab}
                </h2>
                <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              {activeTab === 'Dashboard' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { try { localStorage.removeItem('studentSession'); } catch {} window.location.href = '/student-portal'; }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:opacity-95 text-sm shadow inline-flex items-center gap-2"
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
                {activeTab === 'Subjects' && <StudentSubjects />}
                {activeTab === 'Schedule' && <StudentSchedule schedule={matchedSchedule} />}
                {activeTab === 'Notices' && <StudentNotices />}
                {activeTab === 'Fees' && <StudentFees studentId={String(filtered[0]!._id)} />}
                {activeTab === 'ID Card' && <StudentCard student={filtered[0]} />}
              </div>
            )}

          </div>
        </main>

      </div>

      <Footer />
    </div>
  );
}

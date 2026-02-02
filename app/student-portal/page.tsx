'use client';

import { useEffect, useState, useMemo } from 'react'
import { CalendarCheck, GraduationCap, LayoutDashboard, Megaphone, User, LogOut, QrCode } from 'lucide-react';
import { client } from "@/sanity/lib/client";
import { getAllStudentsQuery, getScheduleByClassQuery } from "@/sanity/lib/queries";
import type { Student } from '@/types/student';
// import { useRouter } from 'next/navigation';

import NavBar from '@/components/NavBar/NavBar';
import StudentDashboard from '@/components/StudentDashboard/StudentDashboard';
import StudentProfile from '@/components/StudentProfile/StudentProfile';
import StudentSchedule from '@/components/StudentSchedule/StudentSchedule';
import StudentNotices from '@/components/StudentNotices/StudentNotices';
import StudentCard from '@/components/StudentCard/StudentCard';
import StudentFees from '@/components/StudentFees/StudentFees';
import StudentQuizzes from '@/components/StudentQuizzes/StudentQuizzes';
import StudentResults from '@/components/StudentResults/StudentResults';
import Sidebar from '@/components/Sidebar/Sidebar';

import AuthLayout from '@/components/Auth/AuthLayout';
import StudentLoginForm from '@/components/Auth/StudentLoginForm';
import { useMobileNav } from '@/contexts/MobileNavContext';

export default function StylishStudentPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessionData, setSessionData] = useState<{ bFormOrCnic: string; grNumber: string } | null>(null)

  // ***************************************************************************************
  type ScheduleDay = { day: string; periods?: { subject: string; time: string }[] }
  const [filtered, setFiltered] = useState<Student[]>([])
  const [matchedSchedule, setMatchedSchedule] = useState<ScheduleDay[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // removed unused states
  const sessionDuration = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await client.fetch(getAllStudentsQuery);
        setStudents(data);
      } catch {
        // handle error
      }
    };

    fetchStudents();
  }, []);

  // Check existing session immediately on mount
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
        setSessionData({ bFormOrCnic, grNumber })
        // If session is valid, we keep loading true until students are loaded and matched
      } else {
        localStorage.removeItem('studentSession')
        setIsLoading(false)
      }
    } catch {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Match student once data and session are available
  useEffect(() => {
    if (!sessionData) {
      if (!isLoading) return // if not loading and no session, we stay unauthenticated
      // if loading but no session (handled above)
      return
    }
    if (students.length === 0) return

    const { bFormOrCnic, grNumber } = sessionData
    const target = (bFormOrCnic || '').replace(/\D+/g, '').slice(0, 13)

    const result = students.filter((s: Student) => {
      const docId = (String((s as any).cnicOrBform ?? '')).replace(/\D+/g, '').slice(0, 13)
      const guardian = (String((s as any).guardianCnic ?? '')).replace(/\D+/g, '').slice(0, 13)
      const father = (String((s as any).fatherCnic ?? '')).replace(/\D+/g, '').slice(0, 13)
      const gr = String((s as any).grNumber ?? '').trim()
      return (docId === target || guardian === target || father === target) && gr === grNumber
    })

    if (result.length > 0) {
      setFiltered(result)
      setIsLoading(false)
      try { localStorage.setItem('studentId', String(result[0]!._id)) } catch { }
    } else {
      // Session invalid against current data
      try { localStorage.removeItem('studentSession') } catch { }
      setSessionData(null)
      setFiltered([])
      setIsLoading(false)
    }
  }, [students, sessionData, isLoading])

  // When filtered student changes, fetch the schedule for their class
  useEffect(() => {
    if (filtered.length === 0) return
    const studentClass = filtered[0].admissionFor
    if (!studentClass) {
      setMatchedSchedule(null)
      return
    }
    let mounted = true
    client.fetch(getScheduleByClassQuery(studentClass))
      .then((sch: { days?: ScheduleDay[] } | null) => { if (!mounted) return; if (sch && sch.days) setMatchedSchedule(sch.days); else setMatchedSchedule(null) })
      .catch(() => { if (!mounted) return; setMatchedSchedule(null) })
      .finally(() => { if (!mounted) return; })
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

  // Get mobile nav context for unified navigation
  const { setPortalNavConfig, clearPortalNav } = useMobileNav();

  // Register sidebar items with mobile nav context for unified navigation
  useEffect(() => {
    setPortalNavConfig({
      title: 'Student Portal',
      items: sidebarItems,
      activeId: activeTab,
      onItemClick: (id: string) => {
        setActiveTab(id);
        if (typeof window !== 'undefined') window.location.hash = id;
      }
    });

    // Cleanup on unmount
    return () => {
      clearPortalNav();
    };
  }, [sidebarItems, activeTab, setPortalNavConfig, clearPortalNav]);

  // Loading State
  if (isLoading || (sessionData && students.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Securely loading portal...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated State (Show Premium Login)
  if (filtered.length === 0) {
    return (
      <AuthLayout
        title="Student Portal"
        subtitle="Verify your identity to access your academic dashboard."
        type="student"
      >
        <StudentLoginForm onLoginSuccess={(student) => {
          setFiltered([student]);
        }} />
      </AuthLayout>
    )
  }

  // Authenticated State (Portal UI)
  return (
    <div>
      <NavBar />
      <div className="min-h-screen flex bg-white transition-all duration-300">

        <Sidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id);
            if (typeof window !== 'undefined') window.location.hash = id;
          }}
        />

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
                    onClick={() => {
                      try { localStorage.removeItem('studentSession'); } catch { }
                      window.location.href = '/student-portal';
                    }}
                    className="px-4 py-2 rounded-lg bg-white text-red-600 hover:bg-red-50 border border-red-100 transition-colors shadow-sm text-sm font-medium inline-flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

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

          </div>
        </main>
      </div>
    </div>
  );
}

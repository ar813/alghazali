'use client';

import { useEffect, useState, useMemo } from 'react'
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { CalendarCheck, LayoutDashboard, Megaphone, User, LogOut, CreditCard, BrainCircuit, Trophy } from 'lucide-react';
import { client } from "@/sanity/lib/client";
import type { Student } from '@/types/student';

import NavBar from '@/components/NavBar/NavBar';
import StudentDashboard from '@/components/StudentDashboard/StudentDashboard';
import StudentProfile from '@/components/StudentProfile/StudentProfile';
import StudentSchedule from '@/components/StudentSchedule/StudentSchedule';
import StudentNotices from '@/components/StudentNotices/StudentNotices';
import StudentFees from '@/components/StudentFees/StudentFees';
import StudentQuizzes from '@/components/StudentQuizzes/StudentQuizzes';
import StudentResults from '@/components/StudentResults/StudentResults';
import Sidebar from '@/components/Sidebar/Sidebar';
import PremiumLoader from '@/components/ui/PremiumLoader';

import AuthLayout from '@/components/Auth/AuthLayout';
import StudentLoginForm from '@/components/Auth/StudentLoginForm';
import { useMobileNav } from '@/contexts/MobileNavContext';

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

// Identity Helpers
const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '').slice(0, 13);
const formatCnic = (s: string) => {
  const d = onlyDigits(s);
  const p1 = d.slice(0, 5);
  const p2 = d.slice(5, 12);
  const p3 = d.slice(12, 13);
  if (d.length <= 5) return p1;
  if (d.length <= 12) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
};

export default function StylishStudentPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sessionData, setSessionData] = useState<{ bFormOrCnic: string; grNumber: string } | null>(null)
  type ScheduleDay = { day: string; periods?: { subject: string; time: string }[] }
  const [filtered, setFiltered] = useState<Student[]>([])
  const [matchedSchedule, setMatchedSchedule] = useState<ScheduleDay[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Handle Session and Data Fetching
  useEffect(() => {
    const initializePortal = async () => {
      try {
        const session = localStorage.getItem('studentSession');
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { timestamp, bFormOrCnic, grNumber } = JSON.parse(session);
        const now = Date.now();

        if (now - timestamp < SESSION_DURATION) {
          setSessionData({ bFormOrCnic, grNumber });

          // Fetch only this specific student - Robust Match (Dashed vs Plain)
          const cleanIdentity = onlyDigits(bFormOrCnic);
          const formattedIdentity = formatCnic(bFormOrCnic);
          const cleanGrNumber = grNumber.trim();

          const studentQuery = `*[_type == "student" && (
            cnicOrBform == $plainIdentity || cnicOrBform == $formattedIdentity ||
            fatherCnic == $plainIdentity || fatherCnic == $formattedIdentity ||
            guardianCnic == $plainIdentity || guardianCnic == $formattedIdentity
          ) && grNumber == $grNumber]{
            _id,
            fullName,
            fatherName,
            fatherCnic,
            dob,
            rollNumber,
            grNumber,
            gender,
            admissionFor,
            nationality,
            medicalCondition,
            cnicOrBform,
            email,
            phoneNumber,
            whatsappNumber,
            address,
            formerEducation,
            previousInstitute,
            lastExamPercentage,
            guardianName,
            guardianContact,
            guardianCnic,
            guardianRelation,
            issueDate,
            expiryDate,
            session,
            "photoUrl": photo.asset->url
          }[0]`;

          const student = await client.fetch(studentQuery, {
            plainIdentity: cleanIdentity,
            formattedIdentity: formattedIdentity,
            grNumber: cleanGrNumber
          });

          if (student) {
            setFiltered([student]);
            try {
              localStorage.setItem('studentId', String(student._id));
              // Ensure session in localStorage is up to date
              const updatedSession = {
                timestamp,
                bFormOrCnic,
                grNumber,
                _id: student._id,
                session: student.session
              };
              localStorage.setItem('studentSession', JSON.stringify(updatedSession));
            } catch { }
          } else {
            // Invalid session data
            localStorage.removeItem('studentSession');
            setSessionData(null);
          }
        } else {
          localStorage.removeItem('studentSession');
        }
      } catch (error) {
        console.error("Portal initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePortal();
  }, []);

  // When filtered student changes, fetch the schedule for their class
  useEffect(() => {
    if (filtered.length === 0) return
    const studentClass = filtered[0].admissionFor
    if (!studentClass) {
      setMatchedSchedule(null)
      return
    }
    let mounted = true
    const getScheduleByClassQuery = () => `*[_type == "schedule" && className == $className][0]`;
    client.fetch(getScheduleByClassQuery(), { className: studentClass })
      .then((sch: { days?: ScheduleDay[] } | null) => { if (!mounted) return; if (sch && sch.days) setMatchedSchedule(sch.days); else setMatchedSchedule(null) })
      .catch(() => { if (!mounted) return; setMatchedSchedule(null) })
      .finally(() => { if (!mounted) return; })
    return () => { mounted = false }
  }, [filtered])

  const sidebarItems = useMemo(() => [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Profile', label: 'Profile', icon: User },
    { id: 'Schedule', label: 'Schedule', icon: CalendarCheck },
    { id: 'Fees', label: 'Fees', icon: CreditCard },
    { id: 'Notices', label: 'Notices', icon: Megaphone },
    { id: 'Quiz', label: 'Quiz', icon: BrainCircuit },
    { id: 'Quiz Result', label: 'Quiz Result', icon: Trophy },
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

  // Loading State - Premium Vercel Style
  if (isLoading || (sessionData && filtered.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <PremiumLoader text="Securely loading your portal..." />
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
        <Toaster position="bottom-right" richColors closeButton />
      </AuthLayout>
    )
  }

  // Authenticated State (Portal UI) - Vercel Theme
  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen">
      <NavBar />
      <div className="min-h-screen flex transition-all duration-300">

        <Sidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id);
            if (typeof window !== 'undefined') window.location.hash = id;
          }}
          isStudent={true}
        />

        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 mt-24 md:mt-24">
          <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            {/* Premium Page Header - Vercel Style */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.15em] mb-2">Student Portal</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight capitalize">
                  {activeTab}
                </h2>
                <div className="h-1 w-10 bg-neutral-900 dark:bg-white rounded-full mt-3"></div>
              </div>
              {activeTab === 'Dashboard' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toast.info("Logging out...");
                      try { localStorage.removeItem('studentSession'); } catch { }
                      setTimeout(() => window.location.href = '/student-portal', 800);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-800 transition-all duration-300 text-sm font-medium inline-flex items-center gap-2 shadow-sm hover:shadow-md"
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
              {activeTab === 'Fees' && <StudentFees studentId={String(filtered[0]!._id)} session={filtered[0]?.session} />}
            </div>

          </div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

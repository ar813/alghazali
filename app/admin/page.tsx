"use client";

import { useEffect, useState } from 'react';
import AdminDashboard from '@/components/AdminDashboard/AdminDashboard';
import AdminReports from '@/components/AdminReports/AdminReports';
import AdminStudents from '@/components/AdminStudents/AdminStudents';
import AdminSchedule from '@/components/AdminSchedule/AdminSchedule';
import NavBar from '@/components/NavBar/NavBar';
import { X } from 'lucide-react';
import { LayoutDashboard, Users as UsersIcon, BarChart3, GraduationCap, ChevronLeft, ChevronRight, Calendar, LogOut, IdCard, Banknote, Megaphone, Smartphone } from 'lucide-react';
import TopLoader from '@/components/TopLoader/TopLoader'
import AdminCards from '@/components/AdminCards/AdminCards';
import AdminNotice from '@/components/AdminNotice/AdminNotice';
import AdminFees from '@/components/AdminFees/AdminFees';
import AdminQuiz from '@/components/AdminQuiz/AdminQuiz';
import AdminResults from '@/components/AdminResults/AdminResults';
import AdminMobileAttendance from '@/components/AdminMobileAttendance/AdminMobileAttendance';
// import { useRouter } from 'next/router';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData) {
        const { timestamp } = JSON.parse(sessionData);
        const now = new Date().getTime();
        const sessionDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

        if (now - timestamp < sessionDuration) {
          setIsAuthenticated(true);
        } else {
          // Session expired, remove it
          localStorage.removeItem('adminSession');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Show loading spinner only while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <NavBar />
      {/* Top non-blocking progress bar for child loading */}
      <TopLoader loading={childLoading} />
      {isAuthenticated && <AdminPortal onLoadingChange={setChildLoading} />}
      {/* <Footer /> */}
      {!isAuthenticated && <Popup onLoginSuccess={() => setIsAuthenticated(true)} />}
    </div>
  );
};

export default AdminPage;

// ✅ Login Popup Component (Enhanced UI)
const Popup = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)

  const adminUsers = [
    { username: 'arsalan', email: 'arsalan@example.com', password: 'admin123' },
    { username: 'ali', email: 'ali@example.com', password: 'pass456' },
    { username: 'zain', email: 'zain@example.com', password: 'secure789' },
    {
      username: process.env.NEXT_PUBLIC_ADMIN_USERNAME || "a",
      email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "a@gmail.com",
      password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "a"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const match = adminUsers.find(
      (admin) =>
        admin.username === username &&
        admin.email === email &&
        admin.password === password
    );

    if (match) {
      // Store session in localStorage with timestamp
      const sessionData = {
        timestamp: new Date().getTime(),
        user: match.username
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      setError('')
      onLoginSuccess();
    } else {
      // Show inline error instead of alert/redirect
      setError('Invalid credentials. Please check and try again.')
    }
  };

  const handleClose = () => {
    window.location.href = "/"
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Admin Login">
      <div className="relative bg-white sm:rounded-2xl rounded-xl shadow-xl p-6 sm:p-8 w-full sm:w-[90%] sm:max-w-md">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition p-2 rounded-full focus:outline-none focus:ring focus:ring-gray-200"
          aria-label="Close popup"
        >
          <X size={22} />
        </button>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Admin Login</h2>
          <p className="text-sm text-gray-500 mt-1">Please enter your credentials to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Use the configured admin username.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Your admin email address.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 pr-16 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-2 my-1 px-2 text-xs rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Your password is case sensitive.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-95 transition-all shadow"
          >
            Login
          </button>
          <div className="text-[11px] text-gray-500 text-center">Tip: You can configure credentials via environment variables.</div>
        </form>
      </div>
    </div>
  );
};

// ✅ Admin Portal (sidebar layout similar to student portal)
const AdminPortal = ({ isBlurred = false, onLoadingChange }: { isBlurred?: boolean; onLoadingChange?: (loading: boolean) => void }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'schedule' | 'reports' | 'cards' | 'fees' | 'notice' | 'quiz' | 'results' | 'examResults' | 'mobile-attendance'>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const sidebarItems: { id: 'dashboard' | 'students' | 'schedule' | 'reports' | 'cards' | 'fees' | 'notice' | 'quiz' | 'results' | 'examResults' | 'mobile-attendance'; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: UsersIcon },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'cards', label: 'Card', icon: IdCard },
    { id: 'fees', label: 'Fees', icon: Banknote },
    { id: 'notice', label: 'Notice', icon: Megaphone },
    { id: 'quiz', label: 'Quiz', icon: GraduationCap },
    { id: 'results', label: 'Quiz Result', icon: BarChart3 },
    { id: 'mobile-attendance', label: 'Mobile Attendance', icon: Smartphone },
  ];

  // Sync tab with URL hash (#dashboard/#students/#schedule/#reports)
  useEffect(() => {
    const applyHash = () => {
      const hash = (typeof window !== 'undefined' && window.location.hash.replace('#', '')) as typeof activeTab | ''
      if (hash && ['dashboard', 'students', 'schedule', 'reports', 'cards', 'fees', 'notice', 'quiz', 'results', 'examResults', 'mobile-attendance'].includes(hash)) {
        setActiveTab(hash as any)
      }
    }
    applyHash()
    const onHash = () => applyHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Notify parent to show loader whenever tab changes (until child reports done)
  useEffect(() => {
    onLoadingChange?.(true)
  }, [activeTab, onLoadingChange])

  return (
    <div className={`${isBlurred ? 'pointer-events-none select-none' : ''}`}>
      <div className={`min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-300 ${isBlurred ? 'blur-sm scale-[.98] brightness-90' : ''}`}>
        {/* Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex md:hidden z-30">
          <nav className="flex w-full px-2 py-2 items-center overflow-x-auto gap-1">
            {sidebarItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); if (typeof window !== 'undefined') window.location.hash = id; }}
                className={`flex-[0_0_20%] shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-lg ${activeTab === id ? 'text-blue-600' : 'text-gray-600'
                  }`}
              >
                <Icon size={20} className={activeTab === id ? 'scale-110' : ''} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar - Desktop (sticky + independent scroll) */}
        <aside className={`transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} bg-white/80 backdrop-blur-xl shadow-2xl hidden md:flex flex-col border-r border-white/20 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto`}>
          {/* Toggle Button */}
          <div className="flex justify-end p-2">
            <button onClick={() => setCollapsed(!collapsed)} className="text-gray-600 hover:text-gray-800 transition-all">
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Logo / Branding */}
          <div className={`p-6 text-center border-b border-gray-200/50 pt-6 transition-all duration-300 ${collapsed ? 'pt-0' : 'pt-6'}`}>
            {!collapsed && (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <GraduationCap size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-sm text-gray-500 mt-1">Management Dashboard</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {sidebarItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); if (typeof window !== 'undefined') window.location.hash = id; }}
                className={`group flex items-center w-full gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] ${activeTab === id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <Icon size={20} className={`transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-105'}`} />
                {!collapsed && <span className="font-medium">{label}</span>}
                {activeTab === id && !collapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content (separate scroll) */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 overflow-auto">
          <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            <div className="mb-6 sm:mb-8 pt-4 sm:pt-8 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 capitalize">
                  {sidebarItems.find(i => i.id === activeTab)?.label}
                </h2>
                <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { try { localStorage.removeItem('adminSession'); } catch { } window.location.href = '/admin'; }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white hover:opacity-95 text-sm shadow inline-flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'dashboard' && <AdminDashboard onLoadingChange={onLoadingChange} />}
            {activeTab === 'students' && <AdminStudents onLoadingChange={onLoadingChange} />}
            {activeTab === 'schedule' && <AdminSchedule onLoadingChange={onLoadingChange} />}
            {activeTab === 'reports' && <AdminReports onLoadingChange={onLoadingChange} />}
            {activeTab === 'cards' && <AdminCards onLoadingChange={onLoadingChange} />}
            {activeTab === 'fees' && <AdminFees onLoadingChange={onLoadingChange} />}
            {activeTab === 'notice' && <AdminNotice onLoadingChange={onLoadingChange} />}
            {activeTab === 'quiz' && <AdminQuiz onLoadingChange={onLoadingChange} />}
            {activeTab === 'results' && <AdminResults onLoadingChange={onLoadingChange} />}
            {activeTab === 'mobile-attendance' && <AdminMobileAttendance onLoadingChange={onLoadingChange} />}
          </div>
        </main>
      </div>
    </div>
  );
};

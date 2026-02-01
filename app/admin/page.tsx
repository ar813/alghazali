
"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import NavBar from '@/components/NavBar/NavBar';
import { X } from 'lucide-react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { LayoutDashboard, Users as UsersIcon, BarChart3, GraduationCap, Calendar, LogOut, IdCard, Banknote, Megaphone, Smartphone, MessageSquare, Edit2, FileQuestion, ClipboardList } from 'lucide-react';
import TopLoader from '@/components/TopLoader/TopLoader'

// Lazy load admin components for better performance
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard/AdminDashboard'), { ssr: false });
const AdminReports = dynamic(() => import('@/components/AdminReports/AdminReports'), { ssr: false });
const AdminStudents = dynamic(() => import('@/components/AdminStudents/AdminStudents'), { ssr: false });
const AdminSchedule = dynamic(() => import('@/components/AdminSchedule/AdminSchedule'), { ssr: false });
const AdminCards = dynamic(() => import('@/components/AdminCards/AdminCards'), { ssr: false });
const AdminNotice = dynamic(() => import('@/components/AdminNotice/AdminNotice'), { ssr: false });
const AdminFees = dynamic(() => import('@/components/AdminFees/AdminFees'), { ssr: false });
const AdminQuiz = dynamic(() => import('@/components/AdminQuiz/AdminQuiz'), { ssr: false });
const AdminResults = dynamic(() => import('@/components/AdminResults/AdminResults'), { ssr: false });
const AdminMobileAttendance = dynamic(() => import('@/components/AdminMobileAttendance/AdminMobileAttendance'), { ssr: false });
const AdminChatBot = dynamic(() => import('@/components/AdminChatBot/AdminChatBot'), { ssr: false });

import AuthLayout from '@/components/Auth/AuthLayout';
import AdminLoginForm from '@/components/Auth/AdminLoginForm';
import { useAuth } from '@/hooks/use-auth';
import AccessDeniedDialog from '@/components/Auth/AccessDeniedDialog';

// Lazy load AdminUsers
const AdminUsers = dynamic(() => import('@/components/AdminUsers/AdminUsers'), { ssr: false });

const AdminPage = () => {
  const { user, loading } = useAuth();
  const [childLoading, setChildLoading] = useState(true);

  // Show loading spinner only while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthLayout
        title="Admin Portal"
        subtitle="Sign in to manage the school dashboard."
        type="admin"
      >
        <AdminLoginForm onLoginSuccess={() => { }} />
      </AuthLayout>
    );
  }

  return (
    <div className="relative pt-20">
      <NavBar />
      {/* Top non-blocking progress bar for child loading */}
      <TopLoader loading={childLoading} />
      <AdminPortal onLoadingChange={setChildLoading} childLoading={childLoading} />
    </div>
  );
};

export default AdminPage;

// ✅ Admin Portal (sidebar layout similar to student portal)
const AdminPortal = ({ isBlurred = false, onLoadingChange, childLoading }: { isBlurred?: boolean; onLoadingChange?: (loading: boolean) => void; childLoading?: boolean }) => {
  // useAuth hook for global state
  const { user, loading: authLoading, isSuperAdmin, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'schedule' | 'reports' | 'cards' | 'fees' | 'notice' | 'quiz' | 'results' | 'examResults' | 'mobile-attendance' | 'chatbot' | 'users'>('dashboard');
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // Effect to handle access denied for non-super admins trying to access restricted tabs
  useEffect(() => {
    if (activeTab === 'users' && !isSuperAdmin && !authLoading) {
      setShowAccessDenied(true);
      setActiveTab('dashboard'); // Redirect back to safe tab
    }
  }, [activeTab, isSuperAdmin, authLoading]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsUpdatingName(true);
    try {
      const { auth, db } = await import('@/lib/firebase');
      const { updateProfile } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');

      if (auth.currentUser) {
        // Update Auth Profile
        await updateProfile(auth.currentUser, {
          displayName: newName.trim()
        });

        // Sync to Firestore 'users' collection
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: newName.trim(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Force reload or just close popup
        setShowNamePopup(false);
        // Ideally we would trigger a context refresh here, but for now strictly relying on firebase auth state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const sidebarItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Students', icon: UsersIcon },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'cards', label: 'Cards', icon: IdCard },
      { id: 'fees', label: 'Fees', icon: Banknote },
      { id: 'notice', label: 'Notice', icon: Megaphone },
      { id: 'quiz', label: 'Quiz', icon: FileQuestion },
      { id: 'results', label: 'Results', icon: ClipboardList },
      { id: 'mobile-attendance', label: 'Mobile Attendance', icon: Smartphone },
      { id: 'chatbot', label: 'AI Assistant', icon: MessageSquare },
    ];

    if (isSuperAdmin) {
      items.push({ id: 'users', label: 'User Management', icon: UsersIcon });
    }

    return items;
  }, [isSuperAdmin]);

  // Sync tab with URL hash (#dashboard/#students/#schedule/#reports)
  useEffect(() => {
    const applyHash = () => {
      const hash = (typeof window !== 'undefined' && window.location.hash.replace('#', '')) as typeof activeTab | ''
      if (hash && sidebarItems.some(item => item.id === hash)) {
        setActiveTab(hash as any)
      }
    }
    applyHash()
    const onHash = () => applyHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [sidebarItems])

  // Notify parent to show loader whenever tab changes (until child reports done)
  useEffect(() => {
    onLoadingChange?.(true)
  }, [activeTab, onLoadingChange])

  return (
    <div className={`${isBlurred ? 'pointer-events-none select-none' : ''} `}>
      {/* Name Update Modal */}
      {showNamePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4 pointer-events-auto select-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-in fade-in zoom-in duration-300 relative">
            {/* Close button for edit mode (only if user already has a name) */}
            {user?.displayName && (
              <button
                onClick={() => setShowNamePopup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {user?.displayName ? 'Update Profile' : 'Welcome! 👋'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {user?.displayName ? 'Change your display name below.' : 'Please set your display name to continue.'}
            </p>

            <form onSubmit={handleNameUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Arsalan"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingName || !newName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingName ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={`min-h-screen flex bg-white transition-all duration-300 ${isBlurred ? 'blur-sm scale-[.98] brightness-90' : ''}`}>

        {/* NEW Sidebar */}
        <Sidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id as any);
            if (typeof window !== 'undefined') window.location.hash = id;
          }}
          loading={authLoading || isUpdatingName || childLoading} // Basic auth loading + content loading
        />

        {/* Main Content (separate scroll) */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 capitalize">
                  {sidebarItems.find(i => i.id === activeTab)?.label}
                </h2>
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              {activeTab === 'dashboard' && user && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-2 pl-3 pr-2 w-full sm:w-auto flex items-center gap-3">
                  {/* User Info Section */}
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-sm">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  {/* Name and Email */}
                  <div className="min-w-0 mr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {user.displayName || 'Admin'}
                      </p>
                      <button
                        onClick={() => {
                          setNewName(user.displayName || '');
                          setShowNamePopup(true);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Name"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate leading-none">{user.email}</p>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={async () => {
                      await logout();
                      window.location.href = '/admin';
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
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
            {activeTab === 'chatbot' && <AdminChatBot />}
            {activeTab === 'users' && isSuperAdmin && <AdminUsers onLoadingChange={onLoadingChange} />}
          </div>
        </main>
      </div>
      <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
    </div>
  );
};

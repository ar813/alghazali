"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { LayoutDashboard, Users as UsersIcon, BarChart3, Calendar, IdCard, Banknote, Megaphone, Smartphone, MessageSquare, FileQuestion, ClipboardList } from 'lucide-react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/hooks/use-auth';
import AccessDeniedDialog from '@/components/Auth/AccessDeniedDialog';
import { useMobileNav } from '@/contexts/MobileNavContext';
import LogoutConfirmationDialog from '@/components/Auth/LogoutConfirmationDialog';

// Lazy load admin components
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
const AdminUsers = dynamic(() => import('@/components/AdminUsers/AdminUsers'), { ssr: false });

const AdminPortal = ({ isBlurred = false, onLoadingChange, childLoading }: { isBlurred?: boolean; onLoadingChange?: (loading: boolean) => void; childLoading?: boolean }) => {
    // useAuth hook for global state
    const { loading: authLoading, isSuperAdmin, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'schedule' | 'reports' | 'cards' | 'fees' | 'notice' | 'quiz' | 'results' | 'examResults' | 'mobile-attendance' | 'chatbot' | 'users'>('dashboard');
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Get mobile nav context for unified navigation
    const { setPortalNavConfig, clearPortalNav } = useMobileNav();

    // Effect to handle access denied for non-super admins trying to access restricted tabs
    useEffect(() => {
        if (activeTab === 'users' && !isSuperAdmin && !authLoading) {
            setShowAccessDenied(true);
            setActiveTab('dashboard'); // Redirect back to safe tab
        }
    }, [activeTab, isSuperAdmin, authLoading]); // eslint-disable-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps


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


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const sidebarItems = useMemo(() => {
        const baseItems = [
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

        const conditionalItems = isSuperAdmin
            ? [{ id: 'users', label: 'User Management', icon: UsersIcon }]
            : [];

        return [...baseItems, ...conditionalItems];
    }, [isSuperAdmin]);

    // Register sidebar items with mobile nav context for unified navigation
    useEffect(() => {
        setPortalNavConfig({
            title: 'Admin Panel',
            items: sidebarItems,
            activeId: activeTab,
            onItemClick: (id: string) => {
                setActiveTab(id as any);
                if (typeof window !== 'undefined') window.location.hash = id;
            }
        });

        // Cleanup on unmount
        return () => {
            clearPortalNav();
        };
    }, [sidebarItems, activeTab, setPortalNavConfig, clearPortalNav]); // eslint-disable-line react-hooks/exhaustive-deps

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
    }, [sidebarItems, setActiveTab]) // eslint-disable-line react-hooks/exhaustive-deps

    // Notify parent to show loader whenever tab changes (until child reports done)
    useEffect(() => {
        onLoadingChange?.(true)
    }, [activeTab, onLoadingChange]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={`${isBlurred ? 'pointer-events-none select-none' : ''} `}>

            <div className={`min-h-screen flex bg-white transition-all duration-300 ${isBlurred ? 'blur-sm scale-[.98] brightness-90' : ''}`}>

                {/* NEW Sidebar */}
                <Sidebar
                    items={sidebarItems}
                    activeTab={activeTab}
                    onTabChange={(id) => {
                        setActiveTab(id as any);
                        if (typeof window !== 'undefined') window.location.hash = id;
                    }}
                    loading={authLoading || childLoading} // Basic auth loading + content loading
                />

                {/* Main Content (separate scroll) */}
                <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                    <div className="max-w-7xl mx-auto pb-20 md:pb-8">
                        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-1 capitalize tracking-tight">
                                    {sidebarItems.find(i => i.id === activeTab)?.label}
                                </h2>
                            </div>
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
            <LogoutConfirmationDialog
                open={showLogoutConfirm}
                onOpenChange={setShowLogoutConfirm}
                onConfirm={async () => {
                    await logout();
                    window.location.href = '/admin';
                }}
            />
        </div>
    );
};

export default AdminPortal;

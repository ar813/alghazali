"use client";

import React from 'react';
import AdminUsers from '@/components/AdminUsers/AdminUsers';
import NavBar from '@/components/NavBar/NavBar';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/Auth/AuthLayout';
import AdminLoginForm from '@/components/Auth/AdminLoginForm';
import { ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
    const { user, role, loading } = useAuth();

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    // Require login
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

    // Require Super Admin role
    if (role !== "super_admin") {
        return (
            <main className="min-h-screen bg-neutral-50/50">
                <NavBar />
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-8 text-center border border-neutral-200 dark:border-neutral-800 shadow-xl">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-100 dark:border-red-900/50 shadow-sm">
                            <ShieldAlert size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Access Denied</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-8">
                            This section is restricted to <span className="text-red-600 dark:text-red-400 font-bold">Super Administrators</span>.
                            Unauthorized access to master records is prevented by system security protocols.
                        </p>
                        <a
                            href="/admin"
                            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium transition-all hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.98]"
                        >
                            Return to Dashboard
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-50/50">
            <NavBar />
            <div className="p-4 sm:p-6 md:p-8 mt-16">
                <div className="max-w-7xl mx-auto">
                    <AdminUsers />
                </div>
            </div>
        </main>
    );
}

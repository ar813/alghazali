"use client";

import React, { useEffect, useState } from 'react';
import { SessionProvider, useSession } from '@/context/SessionContext';
import AdminPortal from '@/components/AdminPortal/AdminPortal';
import NavBar from '@/components/NavBar/NavBar';
import TopLoader from '@/components/TopLoader/TopLoader';
import { useAuth } from '@/hooks/use-auth';
import AuthLayout from '@/components/Auth/AuthLayout';
import AdminLoginForm from '@/components/Auth/AdminLoginForm';

const SessionPage = ({ params }: { params: { session: string } }) => {
    // Decoding param just in case
    const sessionName = decodeURIComponent(params.session);

    return (
        <SessionProvider>
            <SessionContent sessionName={sessionName} />
        </SessionProvider>
    );
};

const SessionContent = ({ sessionName }: { sessionName: string }) => {
    const { setSelectedSession, selectedSession } = useSession();
    const { user, loading } = useAuth();
    const [childLoading, setChildLoading] = useState(true);

    // Force the session context to match the URL
    useEffect(() => {
        if (sessionName && selectedSession !== sessionName) {
            setSelectedSession(sessionName);
        }
    }, [sessionName, selectedSession, setSelectedSession]);

    // Show loading spinner
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

export default SessionPage;

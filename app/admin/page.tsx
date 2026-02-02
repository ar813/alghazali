"use client";

import SessionGrid from '@/components/SessionSelection/SessionGrid';
import AuthLayout from '@/components/Auth/AuthLayout';
import AdminLoginForm from '@/components/Auth/AdminLoginForm';
import { useAuth } from '@/hooks/use-auth';
import { SessionProvider } from '@/context/SessionContext';

const AdminPage = () => {
  return (
    <SessionProvider>
      <AdminEntryContent />
    </SessionProvider>
  );
};

const AdminEntryContent = () => {
  const { user, loading } = useAuth();

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

  // If logged in, show Session Grid
  return <SessionGrid />;
};

export default AdminPage;

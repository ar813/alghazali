"use client";

import { useEffect, useRef, useState } from 'react';
import AdminDashboard from '@/components/AdminDashboard/AdminDashboard';
import AdminReports from '@/components/AdminReports/AdminReports';
import AdminStudents from '@/components/AdminStudents/AdminStudents';
import Footer from '@/components/Footer/Footer';
import NavBar from '@/components/NavBar/NavBar';
import { X } from 'lucide-react';
// import { useRouter } from 'next/router';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    // Show loading spinner while checking session
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <NavBar />
            <AdminPortal isBlurred={!isAuthenticated} />
            <Footer />
            {!isAuthenticated && <Popup onLoginSuccess={() => setIsAuthenticated(true)} />}
        </div>
    );
};

export default AdminPage;

// ✅ Login Popup Component
const Popup = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
//   const router = useRouter();

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
      onLoginSuccess();
    } else {
      alert('Invalid credentials! Redirecting to home...');
      window.location.href = "/"
    //   router.push('/');
    }
  };

  const handleClose = () => {
    window.location.href = "/"
    // router.push('/');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Admin Login">
      <div className="relative bg-white sm:rounded-2xl rounded-none shadow-xl p-6 sm:p-8 w-full sm:w-[90%] sm:max-w-md h-full sm:h-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition p-2 rounded-full focus:outline-none focus:ring"
          aria-label="Close popup"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 sm:py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 sm:py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 sm:py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 sm:py-2 rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// ✅ Admin Portal (only main content is blurred if needed)
const AdminPortal = ({ isBlurred = false }: { isBlurred?: boolean }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'students', label: 'Students' },
        { id: 'reports', label: 'Reports' },
    ];

    useEffect(() => {
        const currentTab = tabRefs.current[activeTab];
        if (currentTab) {
            const { offsetLeft, offsetWidth } = currentTab;
            setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
        }
    }, [activeTab]);

    return (
        <div className={`${isBlurred ? 'pointer-events-none select-none' : ''}`}>
            <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isBlurred ? 'blur-sm scale-[.98] brightness-90' : ''}`}>
                {/* Sticky Tabs Bar for better mobile UX */}
                <nav className="bg-white/90 backdrop-blur sticky top-0 z-30 shadow-sm pt-4">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                        <div className="relative flex items-center justify-between gap-2 sm:gap-4 border-b overflow-x-auto snap-x snap-mandatory">
                            <div
                                className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300"
                                style={{
                                    left: indicatorStyle.left,
                                    width: indicatorStyle.width,
                                }}
                            />
                            <div className="flex gap-2 sm:gap-4">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        ref={(el) => {
                                            tabRefs.current[tab.id] = el;
                                        }}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative py-3 sm:py-4 px-3 sm:px-4 text-sm font-medium capitalize transition-all duration-300 flex-none snap-start
                                            ${activeTab === tab.id
                                                ? 'text-blue-600'
                                                : 'text-gray-500 hover:text-blue-500'
                                            }`}
                                        aria-current={activeTab === tab.id ? 'page' : undefined}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { try { localStorage.removeItem('adminSession'); } catch {} window.location.href = '/admin'; }}
                                className="ml-auto my-2 px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <main
                    key={activeTab}
                    className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 transition-opacity duration-300 opacity-100 animate-[fadeIn_0.3s_ease-in]"
                    style={{
                        animationName: 'fadeIn',
                        animationDuration: '0.3s',
                        animationTimingFunction: 'ease-in',
                    }}
                >
                    {activeTab === 'dashboard' && <AdminDashboard />}
                    {activeTab === 'students' && <AdminStudents />}
                    {activeTab === 'reports' && <AdminReports />}
                </main>
            </div>

            {/* Inline fade-in animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

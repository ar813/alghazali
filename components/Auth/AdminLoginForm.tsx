"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, Check, ArrowRight } from 'lucide-react';

interface AdminLoginFormProps {
    onLoginSuccess: () => void;
}

const AdminLoginForm = ({ onLoginSuccess }: AdminLoginFormProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load saved credentials
    useEffect(() => {
        const savedCredentials = localStorage.getItem('adminCredentials');
        if (savedCredentials) {
            try {
                const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials);
                setEmail(savedEmail || '');
                setPassword(savedPassword || '');
                setRememberMe(true);
            } catch { }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { auth } = await import('@/lib/firebase');
            const { signInWithEmailAndPassword } = await import('firebase/auth');

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                lastLoginAt: new Date().toISOString()
            }, { merge: true });

            const sessionData = {
                timestamp: new Date().getTime(),
                user: userCredential.user.email
            };
            localStorage.setItem('adminSession', JSON.stringify(sessionData));

            if (rememberMe) {
                localStorage.setItem('adminCredentials', JSON.stringify({ email, password }));
            } else {
                localStorage.removeItem('adminCredentials');
            }

            onLoginSuccess();
        } catch (err: any) {
            let errorMessage = 'Invalid email or password.';
            if (err.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Try again later.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.1em] ml-1">Work Email</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-indigo-600 transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 shadow-sm"
                        placeholder="admin@alghazali.edu"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.1em]">Security Password</label>
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-indigo-600 transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 shadow-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 group-hover:border-indigo-500 shadow-sm'}`}>
                        {rememberMe && <Check size={12} strokeWidth={4} />}
                    </div>
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="hidden"
                    />
                    <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Remember device</span>
                </label>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-neutral-900 dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/10 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Verifying...</span>
                    </>
                ) : (
                    <>
                        <span>Sign in to Dashboard</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    );
};

export default AdminLoginForm;

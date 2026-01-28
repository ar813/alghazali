"use client";
import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    homeLink?: string;
    type?: "admin" | "student";
}

const AuthLayout = ({ children, title, subtitle, homeLink = "/", type = "student" }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-neutral-950 overflow-hidden">

            {/* LEFT PANEL: Enterprise Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-neutral-900 overflow-hidden border-r border-white/5">
                {/* Advanced Mesh Gradient */}
                <div className="absolute inset-0 bg-[#0a0a0a]" />
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[80px]" />

                {/* Subtle Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.15] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="relative z-10 flex flex-col justify-between w-full h-full p-12">
                    {/* Top Branding */}
                    <Link href={homeLink} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                            <Image src="/logo.png" alt="Logo" width={28} height={28} />
                        </div>
                        <span className="text-white font-bold tracking-tight text-lg">Al Ghazali High School</span>
                    </Link>

                    {/* Center Message */}
                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                            <Sparkles size={14} />
                            Building Tomorrow's Leaders
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                            Empowering the future through <span className="text-blue-500">academic excellence.</span>
                        </h2>
                        <p className="text-neutral-400 text-lg leading-relaxed">
                            Welcome back to your professional portal. Manage, learn, and grow with Al Ghazali's state-of-the-art management system.
                        </p>
                    </div>

                    {/* Bottom Info */}
                    <div className="flex items-center gap-6 text-neutral-500 text-sm">
                        <span>Est. 1994</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                        <span>Secure Enterprise Auth</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Focused Form */}
            <div className="flex-1 flex flex-col relative">

                {/* Mobile Header (Only visible on small screens) */}
                <div className="lg:hidden flex items-center justify-between p-6 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-900 sticky top-0 z-50">
                    <Link href={homeLink} className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center">
                        <Image src="/logo.png" alt="Logo" width={24} height={24} />
                    </Link>
                    <span className="font-bold text-sm dark:text-white">Al Ghazali School</span>
                </div>

                {/* Back Button (Desktop) */}
                <div className="hidden lg:block absolute top-12 left-12 z-20">
                    <Link
                        href={homeLink}
                        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors group font-medium"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
                    <div className="w-full max-w-[400px]">

                        {/* Dynamic Heading */}
                        <div className="mb-10">
                            <div className={cn(
                                "w-12 h-1 bg-blue-600 mb-6 rounded-full animate-in slide-in-from-left duration-700",
                                type === "admin" ? "bg-indigo-600" : "bg-emerald-600"
                            )} />
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">
                                {title}
                            </h1>
                            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                                {subtitle}
                            </p>
                        </div>

                        {/* Form Specific Background Decoration */}
                        <div className="relative group">
                            <div className="absolute inset-[-20px] bg-neutral-50 dark:bg-neutral-900/50 rounded-[2rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {children}
                        </div>

                        {/* Mobile Copyright */}
                        <div className="lg:hidden mt-12 text-center text-xs text-neutral-400">
                            © {new Date().getFullYear()} Al Ghazali School. Secure Access.
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default AuthLayout;

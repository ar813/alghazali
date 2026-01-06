"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarItem {
    id: string;
    label: string;
    icon: any;
}

interface SidebarProps {
    items: SidebarItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    logo?: React.ReactNode;
    title?: string;
    subtitle?: string;
    // Optional: Allow parent to control collapse for layout adjustments
    onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = ({
    items,
    activeTab,
    onTabChange,
    logo,
    title,
    subtitle,
    onCollapseChange,
}: SidebarProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsiveness
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Update parent when collapse state changes
    useEffect(() => {
        onCollapseChange?.(collapsed);
    }, [collapsed, onCollapseChange]);

    const toggleCollapse = () => {
        setCollapsed((prev) => !prev);
    };

    const sidebarVariants = {
        expanded: { width: "280px", transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
        collapsed: { width: "80px", transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    };

    // Mobile Bottom Nav for quick access (optional hybrid approach)
    // For this "Ultra Professional" request, we'll implement a proper responsive Sidebar 
    // that behaves like a Drawer on mobile and a Sidebar on desktop.

    // Mobile Scroll Logic (Always callable)
    const navRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = useCallback(() => {
        if (navRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        if (isMobile) {
            checkScroll();
            window.addEventListener('resize', checkScroll);
            return () => window.removeEventListener('resize', checkScroll);
        }
    }, [isMobile, checkScroll]);

    const scrollNav = (direction: 'left' | 'right') => {
        if (navRef.current) {
            const scrollAmount = 150;
            navRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };


    if (isMobile) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-2 pt-2 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none">
                <div className="relative mx-auto max-w-lg pointer-events-auto">

                    {/* Scroll Indicators */}
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.button
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => scrollNav('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-blue-600 ml-[-10px]"
                            >
                                <ChevronLeft size={16} />
                            </motion.button>
                        )}
                        {canScrollRight && (
                            <motion.button
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => scrollNav('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-blue-600 mr-[-10px] animate-pulse"
                            >
                                <ChevronRight size={16} />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <nav
                        ref={navRef}
                        onScroll={checkScroll}
                        className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl flex items-center justify-between px-2 py-1.5 overflow-x-auto scrollbar-hide snap-x"
                    >
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`relative flex flex-col items-center justify-center min-w-[64px] h-[54px] rounded-xl transition-all duration-300 snap-start mx-0.5 ${activeTab === item.id
                                    ? "text-blue-600"
                                    : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {activeTab === item.id && (
                                    <motion.div
                                        layoutId="mobile-nav-active"
                                        className="absolute inset-0 bg-blue-50 rounded-xl -z-10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <div className={`relative p-1.5 rounded-lg transition-transform duration-300 ${activeTab === item.id ? "-translate-y-1" : ""}`}>
                                    <item.icon
                                        size={activeTab === item.id ? 20 : 18}
                                        strokeWidth={activeTab === item.id ? 2.5 : 2}
                                        className="transition-all"
                                    />
                                </div>
                                <span className={`text-[10px] font-semibold transition-all duration-300 ${activeTab === item.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 absolute bottom-2"}`}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        );
    }

    // Desktop Sidebar
    return (
        <motion.aside
            initial="expanded"
            animate={collapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            className="sticky top-0 h-screen bg-white border-r border-gray-200 z-30 hidden md:flex flex-col shadow-sm"
        >
            {/* Header */}
            <div className={`p-6 flex items-center ${collapsed ? "justify-center" : "justify-between gap-4"} border-b border-gray-100 h-20`}>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
                    >
                        {logo}
                        <div>
                            {title && <h2 className="font-bold text-gray-900 leading-none text-base">{title}</h2>}
                            {subtitle && <p className="text-[11px] text-gray-500 mt-1 font-medium">{subtitle}</p>}
                        </div>
                    </motion.div>
                )}
                {collapsed && logo}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`group relative flex items-center w-full p-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            } ${collapsed ? "justify-center" : "gap-3"}`}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon
                            size={20}
                            className={`shrink-0 transition-transform ${activeTab === item.id ? "scale-105" : "group-hover:scale-105"} `}
                        />

                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-medium text-sm whitespace-nowrap"
                            >
                                {item.label}
                            </motion.span>
                        )}

                        {/* Active Indicator Dot for Collapsed State */}
                        {collapsed && activeTab === item.id && (
                            <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Toggle Button (Vercel Style) */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={toggleCollapse}
                    className={`w-full flex items-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all ${collapsed ? "justify-center" : "gap-3"}`}
                >
                    {collapsed ? <ChevronRight size={18} /> : <div className="border rounded px-1.5 py-0.5"><ChevronLeft size={14} /></div>}
                    {!collapsed && <span className="text-sm font-medium">Collapse Sidebar</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;

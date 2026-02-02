"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX, IconUser, IconLogout } from "@tabler/icons-react";
import {
    motion,
    AnimatePresence,
} from "framer-motion";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from 'next/image';


interface NavbarProps {
    children: React.ReactNode;
    className?: string;
}

interface NavBodyProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface NavItemsProps {
    items: {
        name: string;
        link: string;
        icon?: React.ReactNode;
    }[];
    className?: string;
    onItemClick?: () => void;
}

interface MobileNavProps {
    children: React.ReactNode;
    className?: string;
    visible?: boolean;
}

interface MobileNavHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface MobileNavMenuProps {
    children: React.ReactNode;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    portalItems?: {
        title: string;
        items: {
            id: string;
            label: string;
            icon?: React.ReactNode;
            isActive?: boolean;
            onClick: () => void;
        }[];
    };
    userInfo?: {
        name: string | null;
        email: string | null;
        image?: string | null;
        role?: string;
        onLogout: () => void;
        onUpdateName: () => void;
    };
}


export const Navbar = ({ children, className }: NavbarProps) => {
    const [visible, setVisible] = useState<boolean>(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.header
            className={cn("fixed inset-x-0 top-0 z-[100] w-full pointer-events-none", className)}
        >
            <div className="pointer-events-auto w-full">
                {React.Children.map(children, (child) =>
                    React.isValidElement(child)
                        ? React.cloneElement(
                            child as React.ReactElement<{ visible?: boolean }>,
                            { visible },
                        )
                        : child,
                )}
            </div>
        </motion.header>
    );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(12px)" : "none",
                boxShadow: visible
                    ? "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                    : "none",
                width: "100%",
                y: 0,
            }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 50,
            }}
            className={cn(
                "relative z-[60] mx-auto hidden w-full max-w-none flex-row items-center justify-between px-8 py-2 lg:flex border-b border-transparent transition-all duration-500 ease-in-out",
                visible && "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-neutral-200/50 dark:border-neutral-800/50",
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <motion.div
            onMouseLeave={() => setHovered(null)}
            className={cn(
                "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2",
                className,
            )}
        >
            {items.map((item, idx) => (
                <a
                    onMouseEnter={() => setHovered(idx)}
                    onClick={onItemClick}
                    className="relative px-4 py-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    key={`link-${idx}`}
                    href={item.link}
                >
                    {hovered === idx && (
                        <motion.div
                            layoutId="hovered"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            className="absolute inset-0 h-full w-full rounded-full bg-neutral-100 dark:bg-neutral-800"
                            style={{ zIndex: -1 }}
                        />
                    )}
                    <span className="relative z-10">{item.name}</span>
                </a>
            ))}
        </motion.div>
    );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(12px)" : "none",
                boxShadow: visible
                    ? "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                    : "none",
                width: "100%",
                borderRadius: "0px",
                y: 0,
            }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 30,
            }}
            className={cn(
                "relative z-[100] mx-auto flex w-full flex-col items-center justify-between px-4 py-2 lg:hidden border-b border-transparent transition-all duration-300",
                visible && "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-neutral-200/50 dark:border-neutral-800/50",
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const MobileNavHeader = ({
    children,
    className,
}: MobileNavHeaderProps) => {
    return (
        <div
            className={cn(
                "flex w-full flex-row items-center justify-between",
                className,
            )}
        >
            {children}
        </div>
    );
};

export const MobileNavMenu = ({
    children,
    className,
    isOpen,
    onClose,
    portalItems,
    userInfo,
}: MobileNavMenuProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm lg:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        className={cn(
                            "fixed right-0 top-0 z-[9999] flex h-full w-[320px] max-w-[85vw] flex-col bg-white dark:bg-neutral-950 shadow-2xl lg:hidden",
                            className,
                        )}
                    >
                        {/* Drawer Header */}
                        <div className="flex h-16 items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-4 xs:px-6">
                            <div className="flex-1 min-w-0 mr-2">
                                <NavbarLogo />
                            </div>
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                aria-label="Close menu"
                            >
                                <IconX size={18} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            {/* Main Navigation Section */}
                            <div className="mb-6">
                                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    Navigation
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {React.Children.map(children, (child, idx) => (
                                        <motion.div
                                            key={`nav-child-${idx}`}
                                            className={cn(
                                                (child as any)?.props?.className?.includes("col-span-2") ? "col-span-2" : ""
                                            )}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            {child}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Portal Items Section (when available) */}
                            {portalItems && portalItems.items.length > 0 && (
                                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                        {portalItems.title}
                                    </p>
                                    <div className="space-y-1">
                                        {portalItems.items.map((item, idx) => (
                                            <motion.button
                                                key={`portal-${idx}`}
                                                onClick={item.onClick}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                className={cn(
                                                    "flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors text-left",
                                                    item.isActive
                                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                                                )}
                                            >
                                                {item.icon && (
                                                    <span className={cn(
                                                        "flex h-8 w-8 items-center justify-center rounded-lg",
                                                        item.isActive
                                                            ? "bg-white/20 dark:bg-neutral-900/20"
                                                            : "bg-neutral-100 dark:bg-neutral-800"
                                                    )}>
                                                        {item.icon}
                                                    </span>
                                                )}
                                                <span>{item.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* User Section (at bottom of scroll area) */}
                            {userInfo && (
                                <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                    <div className="flex items-center gap-3 px-3 mb-4">
                                        <div
                                            onClick={userInfo.onUpdateName}
                                            className="relative h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 cursor-pointer group"
                                        >
                                            {userInfo.image ? (
                                                <Image
                                                    src={userInfo.image}
                                                    alt={userInfo.name || ''}
                                                    width={40}
                                                    height={40}
                                                    className="h-full w-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <IconUser size={20} className="text-neutral-500" />
                                            )}
                                            {/* Edit Badge Overlay */}
                                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-neutral-950 flex items-center justify-center text-white shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0" onClick={userInfo.onUpdateName}>
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                {userInfo.name || 'User'}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                {userInfo.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={userInfo.onLogout}
                                            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                                                <IconLogout size={18} />
                                            </div>
                                            <span>Log out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(menuContent, document.body);
};

export const MobileNavToggle = ({
    isOpen,
    onClick,
}: {
    isOpen: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
        >
            {isOpen ? (
                <IconX size={20} strokeWidth={2} />
            ) : (
                <IconMenu2 size={20} strokeWidth={2} />
            )}
        </button>
    );
};

export const NavbarLogo = () => {
    return (
        <a
            href="/"
            className="relative z-20 flex items-center space-x-2 py-1 select-none"
        >
            <div className="flex-shrink-0">
                <Image
                    src="/logo.png"
                    alt="Al Ghazali Logo"
                    width={28}
                    height={28}
                    className="rounded-lg shadow-sm"
                />
            </div>
            <span className="font-bold text-foreground select-none text-[13px] xs:text-[14px] sm:text-[15px] tracking-[0.05em] xs:tracking-[0.1em] uppercase leading-tight block truncate xs:whitespace-normal">
                Al Ghazali High School
            </span>
        </a>
    );
};

export const NavbarButton = ({
    href,
    as: Tag = "a",
    children,
    className,
    variant = "primary",
    ...props
}: {
    href?: string;
    as?: React.ElementType;
    children: React.ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
        | React.ComponentPropsWithoutRef<"a">
        | React.ComponentPropsWithoutRef<"button">
    )) => {
    const baseStyles =
        "px-4 py-1.5 rounded-xl font-medium text-sm relative cursor-pointer transition duration-200 inline-flex items-center justify-center";

    const variantStyles = {
        primary:
            "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100",
        secondary: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700",
        dark: "bg-foreground text-background shadow-sm hover:bg-foreground/90",
        gradient:
            "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
    };

    return (
        <Tag
            href={href || undefined}
            className={cn(baseStyles, variantStyles[variant], className)}
            {...props}
        >
            {children}
        </Tag>
    );
};

// New component for mobile nav links with icon support
export const MobileNavLink = ({
    href,
    icon,
    children,
    onClick,
    className,
}: {
    href: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}) => {
    return (
        <a
            href={href}
            onClick={onClick}
            className={cn(
                "flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-2 text-center transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95",
                className,
            )}
        >
            {icon && (
                <span className="text-neutral-500 dark:text-neutral-400">
                    {icon}
                </span>
            )}
            <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-center line-clamp-1">
                {children}
            </span>
        </a>
    );
};

"use client";

import React, { useState } from "react";
import { Sidebar as AceternitySidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconLogout } from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { LucideIcon, PanelLeftClose, PanelLeftOpen, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useAuth } from "@/hooks/use-auth";
import LogoutConfirmationDialog from "../Auth/LogoutConfirmationDialog";

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  loading?: boolean;
  isStudent?: boolean;
}

const Sidebar = ({ items, activeTab, onTabChange, loading, isStudent }: SidebarProps) => {
  const [open, setOpen] = useState(false);
  // const [user, setUser] = useState<{ email: string | null; displayName: string | null; photoURL: string | null } | null>(null);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // useEffect removed as we use global auth context

  const handleLogout = async () => {
    if (isStudent) {
      try { localStorage.removeItem('studentSession'); } catch { }
      window.location.href = '/student-portal';
      return;
    }
    await logout();
    window.location.href = '/admin';
  };

  const links = items.map((item) => ({
    label: item.label,
    href: `#${item.id}`,
    icon: (
      activeTab === item.id && loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
      ) : (
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            activeTab === item.id
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 dark:text-neutral-400 group-hover/item:text-neutral-700 dark:group-hover/item:text-neutral-200"
          )}
        />
      )
    ),
  }));

  return (

    <AceternitySidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody className="justify-between gap-0 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto pt-1 pb-2 no-scrollbar">
          {/* Header Section - Minimal */}
          <div className={cn("flex items-center justify-between h-10 transition-all duration-300", open ? "px-5 mb-8" : "px-0 mb-4")}>
            {open ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white dark:text-neutral-900 font-bold text-sm">AG</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-900 dark:text-white text-sm leading-tight">Al Ghazali</span>
                  <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Admin</span>
                </div>
              </motion.div>
            ) : null}

            <button
              onClick={() => setOpen(!open)}
              className={cn(
                "rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center",
                open ? "p-1.5" : "w-full h-10"
              )}
            >
              {open ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
          </div>

          {/* Navigation Links - Clean List */}
          <div className={cn("flex flex-col gap-0.5 transition-all duration-300", open ? "px-3" : "px-0")}>
            {links.map((link, idx) => {
              const isActive = activeTab === link.href.replace('#', '');
              return (
                <div
                  key={idx}
                  onClick={() => {
                    const id = link.href.replace('#', '');
                    onTabChange(id);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg transition-all duration-200 group/item relative flex items-center",
                    open ? "mx-0" : "mx-auto w-10",
                    isActive
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200"
                  )}
                >
                  {/* Subtle Active Indicator Line */}
                  {isActive && (
                    <motion.div
                      layoutId="active-line"
                      className={cn(
                        "absolute w-1 bg-neutral-900 dark:bg-white rounded-r-full",
                        open ? "left-0 top-1.5 bottom-1.5" : "left-0 top-2 bottom-2"
                      )}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 w-full">
                    <SidebarLink
                      link={link}
                      className={cn(
                        "h-auto",
                        open ? "py-2 px-3.5" : "py-2 px-0",
                        isActive ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Section at Bottom - Minimal */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 pb-4 px-3 bg-white dark:bg-neutral-950">
          {/* User Section at Bottom - Minimal (Hidden for students) */}
          {!isStudent && user && (
            <div className="flex items-center gap-3 mb-2 group/user cursor-pointer p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
              <div className="relative">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm border border-neutral-200 dark:border-neutral-700"
                    alt="Avatar"
                  />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-xs border border-neutral-200 dark:border-neutral-700">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className={cn(
                "flex flex-col min-w-0 transition-all duration-300",
                open ? "opacity-100" : "opacity-0 w-0 hidden"
              )}>
                <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                  {user.displayName || 'Admin'}
                </span>
                <span className="text-[10px] text-neutral-500 truncate">
                  {user.email}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div
            onClick={() => setShowLogoutConfirm(true)}
            className="cursor-pointer rounded-lg group/logout hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <SidebarLink
              link={{
                label: "Log out",
                href: "#logout",
                icon: (
                  <IconLogout
                    className="h-4 w-4 shrink-0 text-neutral-500 group-hover/logout:text-neutral-900 dark:group-hover/logout:text-neutral-200 transition-colors"
                  />
                ),
              }}
              className="group-hover/logout:text-neutral-900 dark:group-hover/logout:text-neutral-200 py-2 px-3 text-sm text-neutral-500"
            />
          </div>
        </div>
      </SidebarBody>
      <LogoutConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
      />
    </AceternitySidebar >
  );
};

export default Sidebar;

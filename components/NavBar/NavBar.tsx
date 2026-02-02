"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  MobileNavLink,
} from "@/components/ui/resizable-navbar";
import { useState, createElement } from "react";
import { Home, ReceiptText, GraduationCap, KeyRound, Smartphone, FileDown } from "lucide-react";
import { useMobileNav, PortalNavConfig } from "@/contexts/MobileNavContext";
import { useAuth } from "@/context/AuthContext";
import IslamicDate from "./IslamicDate";
import { AdminDropdown } from "./AdminDropdown";
import ProfileUpdateDialog from "../Auth/ProfileUpdateDialog";

export default function NavBar() {
  const { user, role, logout, loading } = useAuth();
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <Home size={16} />,
    },
    {
      name: "Fees",
      link: "/#admissions",
      icon: <ReceiptText size={16} />,
    },
    {
      name: "Student Portal",
      link: "/student-portal",
      icon: <GraduationCap size={16} />,
    },
    {
      name: "Admin",
      link: "/admin",
      icon: <KeyRound size={16} />,
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get portal navigation from context
  let portalNavConfig: PortalNavConfig | null = null;
  try {
    const mobileNav = useMobileNav();
    portalNavConfig = mobileNav.portalNavConfig;
  } catch {
    // Context not available (outside provider)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Transform portal items for the drawer
  const portalItems = portalNavConfig ? {
    title: portalNavConfig.title,
    items: portalNavConfig.items.map(item => ({
      id: item.id,
      label: item.label,
      icon: createElement(item.icon, { size: 16 }),
      isActive: portalNavConfig!.activeId === item.id,
      onClick: () => {
        portalNavConfig!.onItemClick(item.id);
        closeMobileMenu();
      }
    }))
  } : undefined;

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <div className="flex items-center gap-8 flex-1">
            <NavbarLogo />
            <NavItems items={navItems} className="relative inset-auto justify-start" />
          </div>

          <div className="flex items-center gap-4">
            <IslamicDate variant="nav" className="hidden xl:flex" />
            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden xl:block" />
            <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden xl:block" />

            {loading ? (
              // Skeleton Loader for Button area
              <div className="h-10 w-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse hidden md:block" />
            ) : user ? (
              // Authenticated Admin State
              <AdminDropdown user={user} role={role} logout={logout} />
            ) : (
              // Guest State
              <NavbarButton
                variant="primary"
                href={process.env.NEXT_PUBLIC_MOBILE_APP_URL || "#"}
                target="_blank"
              >
                <Smartphone size={16} className="mr-2" />
                Get Mobile App
              </NavbarButton>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation - Visible on mobile, hidden on desktop */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
            portalItems={portalItems}
            userInfo={user ? {
              name: user.displayName,
              email: user.email,
              image: user.photoURL,
              onLogout: () => {
                logout();
                closeMobileMenu();
              },
              onUpdateName: () => {
                setShowProfileUpdate(true);
                closeMobileMenu();
              }
            } : undefined}
          >
            {/* Islamic Date in Sidebar */}
            <div className="col-span-2 mb-2">
              <IslamicDate variant="sidebar" />
            </div>

            {navItems.map((item, idx) => (
              <MobileNavLink
                key={`mobile-link-${idx}`}
                href={item.link}
                icon={item.icon}
                onClick={closeMobileMenu}
              >
                {item.name}
              </MobileNavLink>
            ))}

            {/* CTA Buttons Grid */}
            <div className="col-span-2 mt-4 flex flex-col gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                Downloads
              </p>
              <div className="grid grid-cols-2 gap-2">
                <NavbarButton
                  onClick={closeMobileMenu}
                  variant="primary"
                  className="w-full h-12 flex-col !rounded-2xl !py-2"
                  href="/assets/Student_Information_Form.pdf"
                  target="_blank"
                >
                  <FileDown size={18} className="mb-0.5" />
                  <span className="text-[10px] uppercase tracking-tight">Admission Form</span>
                </NavbarButton>
                <NavbarButton
                  onClick={closeMobileMenu}
                  variant="secondary"
                  className="w-full h-12 flex-col !rounded-2xl !py-2"
                  href={process.env.NEXT_PUBLIC_MOBILE_APP_URL || "#"}
                  target="_blank"
                >
                  <Smartphone size={18} className="mb-0.5" />
                  <span className="text-[10px] uppercase tracking-tight">Mobile App</span>
                </NavbarButton>
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      <ProfileUpdateDialog
        open={showProfileUpdate}
        onOpenChange={setShowProfileUpdate}
      />
    </div>
  );
}
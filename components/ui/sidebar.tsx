"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2 } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      {/* Mobile sidebar removed - using unified top navbar drawer for mobile navigation */}
    </>
  );
};


export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-[calc(100vh-5rem)] sticky top-20 px-4 pt-4 pb-8 hidden md:flex md:flex-col bg-white dark:bg-neutral-900 w-[280px] shrink-0 border-r border-neutral-200 dark:border-neutral-800 z-50",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "100px") : "300px",
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ..._props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      {/* Floating Toggle Button (Vercel Style) */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-12 h-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 text-neutral-800 dark:text-neutral-200"
            aria-label="Toggle Menu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key="menu"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <IconMenu2 size={22} />
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] md:hidden"
            />
            <motion.div
              initial={{ x: "-50%", y: "-40%", opacity: 0, scale: 0.95 }}
              animate={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
              exit={{ x: "-50%", y: "-40%", opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className={cn(
                "fixed top-1/2 left-1/2 w-[calc(100%-32px)] max-w-[340px] max-h-[85vh] rounded-3xl bg-white dark:bg-neutral-900 p-6 z-50 flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 md:hidden",
                className
              )}
            >

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: any;
}) => {
  const { open, animate } = useSidebar();
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const handleMouseEnter = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.right + 10 });
      setHovered(true);
    }
  };

  return (
    <>
      <a
        ref={ref}
        href={link.href}
        className={cn(
          "flex items-center gap-2 group/sidebar py-2 relative",
          open ? "justify-start" : "justify-center",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        {...props}
      >
        {link.icon}

        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
        >
          {link.label}
        </motion.span>
      </a>

      {/* Tooltip for Collapsed State */}
      <AnimatePresence>
        {!open && hovered && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            className="fixed z-[99999] bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] whitespace-nowrap pointer-events-none flex items-center"
          >
            {/* Small Arrow pointing left */}
            <div className="absolute left-0 top-1/2 -translate-x-[4px] -translate-y-1/2 w-2 h-2 bg-neutral-900 rotate-45" />
            {link.label}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

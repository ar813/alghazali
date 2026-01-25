"use client";

import { useEffect, useState } from 'react';
import { X, ArrowDownToLine, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppDownloadPromo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL || '#';

  useEffect(() => {
    // Show after 4 seconds to not annoy user immediately
    const timer = setTimeout(() => setIsVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-80"
        >
          <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-gray-200 dark:border-slate-700 p-3 sm:p-4 rounded-xl shadow-2xl flex items-center gap-3 sm:gap-4 group hover:scale-[1.02] transition-transform">

            {/* Close Button (Absolute) */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 p-1 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Icon / Mockup */}
            <div className="shrink-0 relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-[-6deg] group-hover:rotate-0 transition-transform duration-300">
                <Zap size={24} className="text-white" fill="currentColor" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                Al Ghazali Mobile App
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                Fast, Secure & Official Access
              </p>

              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <ArrowDownToLine size={14} />
                Download Now
              </a>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppDownloadPromo;

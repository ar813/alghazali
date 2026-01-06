"use client";

import { useEffect, useState } from 'react';
import { X, ArrowDownToLine, Sparkles, Zap, Shield, Bell } from 'lucide-react';

const AppDownloadPromo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL || '#';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className={`relative w-full sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 max-h-[90vh] overflow-y-auto ${isClosing ? 'translate-y-full sm:translate-y-0 sm:scale-90 opacity-0' : 'translate-y-0 sm:scale-100 opacity-100'}`}
        style={{ animation: isClosing ? 'none' : 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Animated Background Glow - smaller on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-40 h-40 sm:w-72 sm:h-72 bg-blue-500/30 rounded-full blur-[60px] sm:blur-[100px] animate-pulse"></div>
          <div className="absolute -bottom-16 -left-16 w-40 h-40 sm:w-72 sm:h-72 bg-purple-500/30 rounded-full blur-[60px] sm:blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Drag Handle - Mobile Only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/30 rounded-full"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6">
          {/* Header - Horizontal on mobile, better spacing */}
          <div className="flex items-center gap-4 mb-5">
            {/* Phone Mockup - Smaller on mobile */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-28 sm:w-24 sm:h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-[24px] border-[3px] border-gray-700 shadow-xl relative overflow-hidden">
                {/* Screen */}
                <div className="absolute inset-1.5 sm:inset-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-[16px] overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center mb-1">
                      <Sparkles size={14} className="text-white sm:hidden" />
                      <Sparkles size={16} className="text-white hidden sm:block" />
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-bold text-center leading-tight">Al Ghazali</p>
                  </div>
                </div>
                {/* Notch */}
                <div className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-6 sm:w-10 h-1.5 sm:h-2 bg-gray-900 rounded-full"></div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                NEW
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-extrabold text-white mb-1 leading-tight">
                Get Our <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">App</span>
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm leading-snug">
                Faster access to everything you need.
              </p>
            </div>
          </div>

          {/* Features Grid - Compact on mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            {[
              { icon: Zap, label: 'Fast', color: 'from-yellow-400 to-orange-500' },
              { icon: Shield, label: 'Secure', color: 'from-green-400 to-emerald-500' },
              { icon: Bell, label: 'Alerts', color: 'from-blue-400 to-cyan-500' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon size={16} className="text-white sm:hidden" />
                  <Icon size={18} className="text-white hidden sm:block" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Download Button */}
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center gap-2 sm:gap-3 w-full py-3.5 sm:py-4 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl text-white font-bold text-base sm:text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl active:scale-[0.98] transition-all overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <ArrowDownToLine size={20} className="relative z-10" />
            <span className="relative z-10">Download Now</span>
            <span className="relative z-10 text-xs bg-white/20 px-2 py-0.5 rounded-full">FREE</span>
          </a>

          {/* Trust Badge */}
          <p className="text-center text-gray-500 text-[10px] sm:text-xs mt-3 sm:mt-4">
            ✨ 100% Free • No Ads • Safe & Secure
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
};

export default AppDownloadPromo;

"use client";

import { Menu, X } from 'lucide-react';
import { useState } from 'react'

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="School Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Al Ghazali High School</h1>
              <p className="text-xs text-blue-200">Excellence in Education Since 1993</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="hover:text-amber-300 transition-colors font-medium">Home</a>
            <a href="/student-portal" className="hover:text-amber-300 transition-colors font-medium">Student</a>
            <a href="/admin" target='_blank' className="hover:text-amber-300 transition-colors font-medium">Admin</a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-controls="mobile-drawer"
            aria-expanded={isMenuOpen ? 'true' : 'false'}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-over Drawer (right side) */}
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden={!isMenuOpen}
        />

        {/* Drawer */}
        <aside
          id="mobile-drawer"
          className={`fixed top-0 right-0 h-full w-72 bg-white text-slate-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          aria-hidden={!isMenuOpen}
        >
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="School Logo" className="w-7 h-7 object-contain" />
                </div>
                <h2 className="font-semibold">Menu</h2>
              </div>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-4">
              <a href="/" className="hover:text-amber-300 transition-colors font-medium">Home</a>
              <a href="/student-portal" className="hover:text-amber-300 transition-colors font-medium">Student</a>
              <a href="/admin" target='_blank' className="hover:text-amber-300 transition-colors font-medium">Admin</a>
            </nav>

            <div className="mt-auto text-sm text-gray-500">Al Ghazali High School</div>
          </div>
        </aside>
      </div>
    </header>
  )
}

export default NavBar
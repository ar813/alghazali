import { BookOpen } from 'lucide-react'
import React from 'react'

const HeroSection = () => {
    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full opacity-20 blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full opacity-20 blur-3xl animate-pulse delay-2000 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Content (No Box) */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                    Welcome to Al Ghazali High School
                </h1>

                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto mb-4 sm:mb-6" />

                <p className="text-lg sm:text-xl text-gray-800 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-6">
                    Nurturing young minds with academic excellence, Islamic values, and modern education. Join our legacy of success spanning over 30 years.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                    <a 
                        href="/student-portal"
                        className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg text-sm sm:text-base text-center"
                    >
                        Student Portal
                    </a>
                    <a 
                        href="/schedule"
                        className="w-full sm:w-auto bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors duration-300 text-sm sm:text-base text-center"
                    >
                        View Schedule
                    </a>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
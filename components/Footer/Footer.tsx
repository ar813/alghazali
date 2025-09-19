import { BookOpen, Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react'
import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-10 sm:py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    <div>
                        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold">Al Ghazali High School</h3>
                                <p className="text-xs sm:text-sm text-gray-400">Excellence in Education</p>
                            </div>
                        </div>
                        <p className="text-sm sm:text-base text-gray-400 mb-4">
                            Providing quality education with Islamic values since 1995. Building tomorrow's leaders today.
                        </p>
                        <div className="flex space-x-3">
                            <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                                <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                                <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                                <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Quick Links</h4>
                        <ul className="space-y-2 sm:space-y-3">
                            <li><a href="#about" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#academics" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Academic Programs</a></li>
                            <li><a href="#faculty" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Faculty</a></li>
                            <li><a href="#admissions" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Admissions</a></li>
                            <li><a href="#contact" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Programs</h4>
                        <ul className="space-y-2 sm:space-y-3">
                            <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Science Stream</a></li>
                            <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Computer Science</a></li>
                            <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Mathematics</a></li>
                            <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Islamic Studies</a></li>
                            <li><a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">English Literature</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Contact Info</h4>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                <p className="text-sm sm:text-base text-gray-400">Block 15, Gulshan-e-Iqbal, Karachi, Pakistan</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <p className="text-sm sm:text-base text-gray-400">+92 21 34567890</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <p className="text-sm sm:text-base text-gray-400">info@alghazalischool.edu.pk</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
                    <p className="text-sm sm:text-base text-gray-400">
                        © 2025 Al Ghazali High School. All rights reserved.
                        <span className="hidden sm:inline"> | </span>
                        <span className="block sm:inline mt-2 sm:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <span className="mx-2">|</span>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </span>
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
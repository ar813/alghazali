import { ArrowRight, BookOpen, Facebook, Instagram, Mail, MapPin, Phone, Twitter, Smartphone, Download } from 'lucide-react'
import React from 'react'

const Footer = () => {
    const appUrl = process.env.NEXT_PUBLIC_MOBILE_APP_URL || '#';

    return (
        <footer className="bg-background text-foreground border-t border-border py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    <div>
                        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                            <div className="w-10 h-10 bg-primary/5 border border-border rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">Al Ghazali High School</h3>
                                <p className="text-sm text-muted-foreground">Excellence in Education</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                            Providing quality education with Islamic values since 1995. Building tomorrow's leaders today.
                        </p>
                        <div className="flex space-x-3">
                            <a href="#" className="w-9 h-9 border border-border rounded-md flex items-center justify-center hover:bg-accent transition-colors">
                                <Facebook className="w-4 h-4 text-muted-foreground" />
                            </a>
                            <a href="#" className="w-9 h-9 border border-border rounded-md flex items-center justify-center hover:bg-accent transition-colors">
                                <Twitter className="w-4 h-4 text-muted-foreground" />
                            </a>
                            <a href="#" className="w-9 h-9 border border-border rounded-md flex items-center justify-center hover:bg-accent transition-colors">
                                <Instagram className="w-4 h-4 text-muted-foreground" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Quick Links</h4>
                        <ul className="space-y-3">
                            <li><a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
                            <li><a href="#academics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Academic Programs</a></li>
                            <li><a href="#faculty" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Faculty</a></li>
                            <li><a href="#admissions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admissions</a></li>
                            <li><a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Programs</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Science Stream</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Computer Science</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mathematics</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Islamic Studies</a></li>
                            <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">English Literature</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Contact Info</h4>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed">Area 36-B, Double Road, Landhi Town, Karachi</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">+92 321 9230035</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">ar3584158@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* App Download Banner - Full Width */}
                <div className="mt-16">
                    <a
                        href={appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block relative overflow-hidden rounded-xl bg-card border border-border p-6 sm:p-8"
                    >
                        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                            {/* Left Side */}
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-border group-hover:scale-105 transition-transform duration-300">
                                    <Smartphone size={28} className="text-primary" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h4 className="text-xl font-bold tracking-tight">Get Our Mobile App</h4>
                                    <p className="text-sm text-muted-foreground">Access everything on the go • 100% Free</p>
                                </div>
                            </div>

                            {/* Right Side - Button */}
                            <div className="flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-lg transition-all hover:bg-primary/90">
                                <Download size={18} />
                                <span className="font-semibold text-sm sm:text-base">Download Now</span>
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </a>
                </div>

                <div className="border-t border-border mt-12 pt-8 text-center sm:flex sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        © 2025 Al Ghazali High School. All rights reserved.
                    </p>
                    <div className="flex items-center justify-center space-x-6 mt-4 sm:mt-0">
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
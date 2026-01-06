import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const Contact = () => {
    const [settings, setSettings] = useState<any>(null)
    useEffect(() => {
        fetch('/api/important', { cache: 'no-store' })
            .then(r => r.json())
            .then(j => { if (j?.ok) setSettings(j.data || null) })
            .catch(()=>{})
    }, [])
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({
        type: null,
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: null, message: '' });

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: 'Thank you! Your message has been sent successfully.'
                });
                setFormData({
                    fullName: '',
                    email: '',
                    subject: 'General Inquiry',
                    message: ''
                });
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch {
            setStatus({
                type: 'error',
                message: 'Sorry, there was an error sending your message. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div>
            <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Contact Us</h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
                            Get in touch with us for any inquiries about admissions, programs, or general information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="lg:col-span-2">
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 sm:p-8">
                                <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Subject</label>
                                        <select 
                                            value={formData.subject}
                                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                        >
                                            <option>General Inquiry</option>
                                            <option>Admission Information</option>
                                            <option>Fee Structure</option>
                                            <option>Academic Programs</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Message</label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                            placeholder="Write your message here..."
                                        />
                                    </div>
                                    {status.message && (
                                        <div className={`p-3 rounded-lg text-sm ${
                                            status.type === 'success' 
                                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                                : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}>
                                            {status.message}
                                        </div>
                                    )}
                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-70 flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Message'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
                                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Contact Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <MapPin className="w-5 h-5 text-blue-200 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-sm sm:text-base">Address</h4>
                                            <p className="text-blue-100 text-sm sm:text-base">{settings?.schoolAddress || 'Area 36-B, Double Road, Landhi Town, Korangi, Karachi, Pakistan'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Phone className="w-5 h-5 text-blue-200 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-sm sm:text-base">Phone</h4>
                                            <p className="text-blue-100 text-sm sm:text-base">{settings?.phoneNumber || '+92 321 9230035'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Mail className="w-5 h-5 text-blue-200 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-sm sm:text-base">Email</h4>
                                            <p className="text-blue-100 text-sm sm:text-base">{settings?.email || 'ar3584158@gmail.com'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Office Hours</h3>
                                <div className="space-y-3">
                                    {(settings?.officeHours || [
                                        { day: 'Saturday - Thursday', open: '8:00 AM', close: '2:10 PM' },
                                        { day: 'Friday', open: 'Closed', close: '' }
                                    ]).map((row: any, idx: number) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                            <span className="text-gray-600 text-sm sm:text-base">{row.day}</span>
                                            <span className="font-semibold text-sm sm:text-base">{row.close ? `${row.open} - ${row.close}` : row.open}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-6 sm:p-8">
                                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Follow Us</h3>
                                <div className="flex space-x-4">
                                    <a href="https://www.facebook.com/p/Al-Ghazali-High-School-36B-Landhi-Karachi-100071529611065/" target='_blank' className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                                        <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors">
                                        <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition-colors">
                                        <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        {/* Embedded Google Map */}
                        <div className="h-[300px] sm:h-[400px] lg:h-[450px] w-full">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.5681714330703!2d67.17068637515153!3d24.844437177939817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33b0a3a3afaf9%3A0x9514f3d506d9b3ce!2sAl%20ghazali%20high%20school!5e0!3m2!1sen!2s!4v1752337256913!5m2!1sen!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full"
                            ></iframe>
                        </div>

                        {/* Info Footer (Optional) */}
                        <div className="p-4 sm:p-6 text-center">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-1">
                                School Location
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                                Area 36-B, Double Road, Landhi Town, Korangi, Karachi, Pakistan
                            </p>
                            <a
                                href="https://www.google.com/maps/dir//Al+ghazali+high+school"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-indigo-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Get Directions
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact
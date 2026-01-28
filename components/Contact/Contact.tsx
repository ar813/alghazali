import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from "sonner"

const Contact = () => {
    const [settings, setSettings] = useState<any>(null)
    useEffect(() => {
        fetch('/api/important', { cache: 'no-store' })
            .then(r => r.json())
            .then(j => { if (j?.ok) setSettings(j.data || null) })
            .catch(() => { })
    }, [])
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

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
                toast.success('Message Sent!', {
                    description: 'Thank you! Your message has been sent successfully.'
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
            toast.error('Submission Failed', {
                description: 'Sorry, there was an error sending your message. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="bg-background">
            <section id="contact" className="py-16 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">Contact Us</h2>
                        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
                            Get in touch with us for any inquiries about admissions, programs, or general information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="lg:col-span-2">
                            <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                                <h3 className="text-2xl font-bold mb-8 text-foreground tracking-tight">Send Us a Message</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full p-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base outline-none transition-all"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full p-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base outline-none transition-all"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full p-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base outline-none transition-all"
                                        >
                                            <option>General Inquiry</option>
                                            <option>Admission Information</option>
                                            <option>Fee Structure</option>
                                            <option>Academic Programs</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full p-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base outline-none transition-all"
                                            placeholder="Write your message here..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm sm:text-base font-bold hover:bg-primary/90 transition-all duration-300 disabled:opacity-70 flex items-center justify-center shadow-lg"
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

                        <div className="space-y-6">
                            <div className="bg-background border border-border rounded-xl p-8 sm:p-10 relative overflow-hidden shadow-enterprise group">
                                <div className="absolute inset-0 bg-grid-enterprise opacity-20" />
                                <h3 className="text-lg sm:text-xl font-bold mb-10 relative z-10 text-foreground tracking-tight flex items-center gap-3">
                                    <span className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                                        <Mail className="w-5 h-5 text-primary" />
                                    </span>
                                    Contact Information
                                </h3>
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-start space-x-5 group/item">
                                        <div className="p-3 bg-secondary rounded-xl border border-border group-hover/item:border-primary/50 transition-colors">
                                            <MapPin className="w-5 h-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/60 mb-1">Our Location</h4>
                                            <p className="text-foreground text-sm leading-relaxed max-w-[200px]">{settings?.schoolAddress || 'Area 36-B, Double Road, Landhi Town, Korangi, Karachi, Pakistan'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-5 group/item">
                                        <div className="p-3 bg-secondary rounded-xl border border-border group-hover/item:border-primary/50 transition-colors">
                                            <Phone className="w-5 h-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/60 mb-1">Call Us</h4>
                                            <p className="text-foreground text-base font-semibold">{settings?.phoneNumber || '+92 321 9230035'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-5 group/item">
                                        <div className="p-3 bg-secondary rounded-xl border border-border group-hover/item:border-primary/50 transition-colors">
                                            <Mail className="w-5 h-5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/60 mb-1">Email Support</h4>
                                            <p className="text-foreground text-base font-semibold">{settings?.email || 'ar3584158@gmail.com'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                                <h3 className="text-lg sm:text-xl font-bold mb-6 text-foreground tracking-tight">Office Hours</h3>
                                <div className="space-y-3">
                                    {(settings?.officeHours || [
                                        { day: 'Saturday - Thursday', open: '8:00 AM', close: '2:10 PM' },
                                        { day: 'Friday', open: 'Closed', close: '' }
                                    ]).map((row: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                            <span className="text-muted-foreground text-sm">{row.day}</span>
                                            <span className="font-semibold text-sm text-foreground">{row.close ? `${row.open} - ${row.close}` : row.open}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                                <h3 className="text-lg sm:text-xl font-bold mb-6 text-foreground tracking-tight">Follow Us</h3>
                                <div className="flex space-x-4">
                                    <div className="flex space-x-3">
                                        <a href="https://www.facebook.com/p/Al-Ghazali-High-School-36B-Landhi-Karachi-100071529611065/" target='_blank' className="w-11 h-11 border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-all duration-200">
                                            <Facebook className="w-5 h-5" />
                                        </a>
                                        <a href="#" className="w-11 h-11 border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-all duration-200">
                                            <Twitter className="w-5 h-5" />
                                        </a>
                                        <a href="#" className="w-11 h-11 border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-accent transition-all duration-200">
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-16 border-t border-border bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
                        <div className="p-8 text-center bg-card">
                            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
                                School Location
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Area 36-B, Double Road, Landhi Town, Korangi, Karachi, Pakistan
                            </p>
                            <a
                                href="https://www.google.com/maps/dir//Al+ghazali+high+school"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md group"
                            >
                                Get Directions
                                <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact
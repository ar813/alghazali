import { ChevronRight } from 'lucide-react'
import React from 'react'

const FEE_STRUCTURE_2025: { className: string; amount: number }[] = [
    { className: 'Admission (New Students)', amount: 4000 },
    { className: 'Admission (Old Students)', amount: 2500 },
    { className: 'Class 1', amount: 900 },
    { className: 'Class 2', amount: 900 },
    { className: 'Class 3', amount: 1000 },
    { className: 'Class 4', amount: 1000 },
    { className: 'Class 5', amount: 1100 },
    { className: 'Class 6', amount: 1200 },
    { className: 'SSCI', amount: 1300 },
    { className: 'SSCII', amount: 1300 },
]

const AdmissionDetail = () => {
    return (
        <section id="admissions" className="py-16 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10 sm:mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">Admissions Open 2025</h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
                        Join our community of learners and give your child the best foundation for their future success.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
                    <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-foreground tracking-tight">Admission Requirements</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <ChevronRight className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-base text-foreground">Age Requirements</h4>
                                    <p className="text-muted-foreground text-sm">Class 1: 5-6 years, Class 6: 10-11 years</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <ChevronRight className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-base text-foreground">Documents Required</h4>
                                    <p className="text-muted-foreground text-sm">Birth certificate, B-Form, Father CNIC, previous school records</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <ChevronRight className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-base text-foreground">Admission Test</h4>
                                    <p className="text-muted-foreground text-sm">Written test and interview for classes 1-10</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background border border-border rounded-xl p-8 sm:p-10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-enterprise opacity-20" />
                        <h3 className="text-xl sm:text-2xl font-bold mb-8 relative z-10 text-foreground tracking-tight flex items-center gap-2">
                            <span className="w-2 h-8 bg-primary rounded-full" />
                            Fee Structure 2025
                        </h3>
                        <div className="space-y-2 relative z-10 text-sm">
                            {FEE_STRUCTURE_2025.map((row, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-border/50 hover:bg-secondary/30 px-2 transition-colors rounded-md">
                                    <span className="text-muted-foreground font-medium">{row.className}</span>
                                    <span className="font-mono font-bold text-foreground">Rs. {row.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 relative z-10">
                            <a href="/assets/Student_Information_Form.pdf" target="_blank" className="block w-full">
                                <button className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold text-sm sm:text-base hover:bg-primary/90 transition-all shadow-enterprise active:scale-[0.98]">
                                    Download Admission Form
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AdmissionDetail
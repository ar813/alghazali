import { ChevronRight } from 'lucide-react'
import React from 'react'

const FEE_STRUCTURE_2025: { className: string; amount: number }[] = [
    { className: 'Class 1', amount: 1500 },
    { className: 'Class 2', amount: 1600 },
    { className: 'Class 3', amount: 1700 },
    { className: 'Class 4', amount: 1800 },
    { className: 'Class 5', amount: 1900 },
    { className: 'Class 6', amount: 2000 },
    { className: 'Class 7', amount: 2100 },
    { className: 'Class 8', amount: 2200 },
    { className: 'SSCI', amount: 2500 },
    { className: 'SSCII', amount: 2700 },
]

const AdmissionDetail = () => {
    return (
        <section id="admissions" className="py-12 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Admissions Open 2025</h2>
                    <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                        Join our community of learners and give your child the best foundation for their future success.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Admission Requirements</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base">Age Requirements</h4>
                                    <p className="text-gray-600 text-xs sm:text-sm">Class 1: 5-6 years, Class 6: 10-11 years</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base">Documents Required</h4>
                                    <p className="text-gray-600 text-xs sm:text-sm">Birth certificate, previous school records, medical certificate</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm sm:text-base">Admission Test</h4>
                                    <p className="text-gray-600 text-xs sm:text-sm">Written test and interview for classes 2-10</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Fee Structure 2025</h3>
                        <div className="space-y-4">
                            {FEE_STRUCTURE_2025.map((row, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm sm:text-base">
                                    <span>{row.className}</span>
                                    <span className="font-semibold">Rs. {row.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 sm:mt-8">
                            <button className="w-full bg-white text-indigo-600 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-colors">
                                Download Admission Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AdmissionDetail
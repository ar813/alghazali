import React, { useState } from 'react';
import Image from 'next/image';
import type { Student } from '@/types/student';
import ImageModal from '@/components/ImageModal/ImageModal';


interface StudentDetailModalProps {
    student: Student | null;
    onClose: () => void;
}

const Info = ({ label, value, copyable }: { label: string; value?: any; copyable?: boolean }) => {
    const displayValue = value === undefined || value === null || value === '' ? '—' : String(value);
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (displayValue === '—') return;
        navigator.clipboard.writeText(displayValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col bg-gray-50/50 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors relative group">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                {label}
            </span>
            <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${displayValue === '—' ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                    {displayValue}
                </span>
                {copyable && displayValue !== '—' && (
                    <button
                        onClick={handleCopy}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
    const [imgPreviewOpen, setImgPreviewOpen] = useState(false);

    if (!student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-6" onClick={onClose}>
            <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] sm:rounded-2xl shadow-2xl overflow-y-auto relative animate-in fade-in zoom-in duration-200 custom-scrollbar" onClick={e => e.stopPropagation()}>




                <div className="h-20 sm:h-32 bg-gradient-to-r from-blue-600 to-cyan-500 relative shrink-0">

                    <button
                        onClick={onClose}

                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-all z-50"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Profile Section */}
                {/* Profile Section */}
                <div className="px-5 sm:px-8 -mt-14 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-6 relative z-10">
                    <div

                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative shrink-0"
                        onClick={() => student.photoUrl && setImgPreviewOpen(true)}
                    >
                        {student.photoUrl ? (
                            <Image src={student.photoUrl} alt={student.fullName} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 text-3xl sm:text-4xl font-bold">
                                {student.fullName?.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="text-center sm:text-left pb-1 sm:pb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{student.fullName}</h2>
                        <p className="text-sm sm:text-base text-gray-500 font-medium">Class {student.admissionFor} • Roll No: {student.rollNumber}</p>
                    </div>
                </div>


                {/* Scrollable Content */}
                {/* Scrollable Content */}
                <div className="px-5 sm:px-8 pb-8">



                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Personal Info */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Info label="Father Name" value={student.fatherName} />
                                <Info label="Gender" value={student.gender} />
                                <Info label="Date of Birth" value={student.dob} />
                                <Info label="CNIC / B-Form" value={student.cnicOrBform} copyable />
                                <Info label="Father CNIC" value={(student as any).fatherCnic} copyable />
                                <Info label="Nationality" value={student.nationality} />
                                <Info label="Medical" value={student.medicalCondition} />
                            </div>

                        </section>

                        {/* Academic & Contact */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                                    Academic & Contact
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Info label="GR Number" value={student.grNumber} copyable />
                                    <Info label="Former Edu" value={student.formerEducation} />
                                    <Info label="Prev Institute" value={student.previousInstitute} />
                                    <Info label="Last Exam %" value={student.lastExamPercentage} />
                                    <div className="sm:col-span-2">
                                        <Info label="Address" value={student.address} />
                                    </div>
                                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Info label="Phone" value={student.phoneNumber} copyable />
                                        <Info label="WhatsApp" value={student.whatsappNumber} copyable />
                                    </div>
                                </div>

                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
                                    Guardian Info
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Info label="Guardian Name" value={student.guardianName} />
                                    <Info label="Relation" value={student.guardianRelation} />
                                    <Info label="Guardian Contact" value={student.guardianContact} copyable />
                                    <Info label="Guardian CNIC" value={student.guardianCnic} copyable />
                                </div>

                            </section>
                        </div>
                    </div>

                </div>

                <ImageModal
                    open={imgPreviewOpen}
                    src={student.photoUrl}
                    alt={student.fullName}
                    onClose={() => setImgPreviewOpen(false)}
                />
            </div>
        </div>
    );
};

export default StudentDetailModal;

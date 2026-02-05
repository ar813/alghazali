import React, { useState } from 'react'
import Image from 'next/image';
import { User, Phone, Landmark, GraduationCap, Calendar, MapPin, Award, Shield, Heart, Building } from 'lucide-react'
import { Student } from '@/types/student';
import ImageModal from '@/components/ImageModal/ImageModal'

export default function StudentProfile({ student }: { student: Student }) {
    const [imgOpen, setImgOpen] = useState(false)

    const getInitial = (name?: string) => {
        if (!name) return 'A'
        const first = name.trim().charAt(0).toUpperCase()
        return first || 'A'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Profile Header - Vercel Premium Dark Style */}
            <div className="relative bg-neutral-900 dark:bg-neutral-950 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-neutral-800">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 bg-[#0a0a0a]" />
                <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[80%] bg-indigo-600/15 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] bg-purple-600/10 rounded-full blur-[60px]" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    {/* Profile Image */}
                    <div className="relative">
                        {student.photoUrl ? (
                            <Image
                                src={student.photoUrl}
                                alt="Student Avatar"
                                width={120}
                                height={120}
                                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border-2 border-white/10 shadow-xl cursor-zoom-in"
                                onClick={() => setImgOpen(true)}
                                title="Click to enlarge"
                            />
                        ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 border-2 border-white/10 shadow-xl flex items-center justify-center text-4xl font-bold">
                                {getInitial(student.fullName)}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-neutral-900 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    </div>

                    <div className="text-center sm:text-left">
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">Student Profile</p>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{student.fullName}</h2>
                        <p className="text-neutral-400 text-sm">{student.admissionFor} • Roll #{student.rollNumber}</p>
                    </div>
                </div>
            </div>

            {/* Info Sections - Vercel Enterprise Style */}
            <div className="space-y-6">
                {/* Personal Info */}
                <InfoSection
                    icon={User}
                    title="Personal Information"
                    iconColor="text-blue-600 dark:text-blue-400"
                >
                    <InfoCard label="Father's Name" value={student.fatherName} />
                    <InfoCard label="Father CNIC" value={student.fatherCnic || 'N/A'} />
                    <InfoCard label="Date of Birth" value={student.dob} icon={Calendar} />
                    <InfoCard label="Gender" value={student.gender} />
                    <InfoCard label="Nationality" value={student.nationality} />
                    <InfoCard label="CNIC / B-Form" value={student.cnicOrBform} icon={Shield} />
                    <InfoCard label="Medical Condition" value={student.medicalCondition || 'N/A'} icon={Heart} />
                    <InfoCard label="GR Number" value={student.grNumber} icon={Award} />
                    <InfoCard label="Academic Session" value={student.session || 'N/A'} icon={Calendar} />
                </InfoSection>

                {/* Contact Info */}
                <InfoSection
                    icon={Phone}
                    title="Contact Details"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                >
                    <InfoCard label="Email" value={student.email || 'N/A'} isEmail />
                    <InfoCard label="Phone Number" value={student.phoneNumber || 'N/A'} isPhone />
                    <InfoCard label="WhatsApp Number" value={student.whatsappNumber || 'N/A'} isPhone />
                    <InfoCard label="Address" value={student.address || 'N/A'} icon={MapPin} fullWidth />
                </InfoSection>

                {/* Education Info */}
                <InfoSection
                    icon={GraduationCap}
                    title="Educational Background"
                    iconColor="text-purple-600 dark:text-purple-400"
                >
                    <InfoCard label="Former Education" value={student.formerEducation || 'N/A'} />
                    <InfoCard label="Previous Institute" value={student.previousInstitute || 'N/A'} icon={Building} />
                    <InfoCard label="Last Exam %" value={student.lastExamPercentage || 'N/A'} icon={Award} />
                </InfoSection>

                {/* Guardian Info */}
                <InfoSection
                    icon={Landmark}
                    title="Guardian Information"
                    iconColor="text-orange-600 dark:text-orange-400"
                >
                    <InfoCard label="Guardian Name" value={student.guardianName || 'N/A'} icon={User} />
                    <InfoCard label="Guardian Contact" value={student.guardianContact || 'N/A'} isPhone />
                    <InfoCard label="Guardian CNIC" value={student.guardianCnic || 'N/A'} icon={Shield} />
                    <InfoCard label="Relation" value={student.guardianRelation || 'N/A'} />
                </InfoSection>
            </div>

            <ImageModal open={imgOpen} src={student.photoUrl} alt={student.fullName} onClose={() => setImgOpen(false)} />
        </div>
    )
}

// Section wrapper component
const InfoSection = ({
    icon: Icon,
    title,
    iconColor,
    children
}: {
    icon: React.ElementType;
    title: string;
    iconColor: string;
    children: React.ReactNode
}) => (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wider">
            <Icon size={16} className={iconColor} />
            {title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
)

// Info card component
const InfoCard = ({
    label,
    value,
    icon: Icon,
    isPhone,
    isEmail,
    fullWidth
}: {
    label: string;
    value: string;
    icon?: React.ElementType;
    isPhone?: boolean;
    isEmail?: boolean;
    fullWidth?: boolean;
}) => (
    <div className={`p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50 transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-800 ${fullWidth ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
        <div className="flex items-start gap-3">
            {Icon && (
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-neutral-500 dark:text-neutral-400" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                {isPhone ? (
                    <a href={`tel:${value}`} className="text-sm font-semibold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all">
                        {value}
                    </a>
                ) : isEmail ? (
                    <a href={`mailto:${value}`} className="text-sm font-semibold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all">
                        {value}
                    </a>
                ) : (
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white break-words">{value}</p>
                )}
            </div>
        </div>
    </div>
)
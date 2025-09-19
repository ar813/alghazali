import { User, Mail, Phone, TrendingUp, Calendar, MapPin, Landmark } from 'lucide-react'
import { Student } from '@/types/student';


export default function StudentProfile({ student }: { student: Student }) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-lg sm:shadow-2xl overflow-hidden border border-white/20">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 lg:p-8 text-white">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                        <img
                            src={student.photoUrl}
                            alt="Student Avatar"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 sm:border-4 border-white/30 shadow-lg object-cover"
                        />
                        <div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{student.fullName}</h3>
                            <p className="text-base sm:text-lg text-blue-100">Admission For: {student.admissionFor}</p>
                            <p className="text-xs sm:text-sm text-blue-200 mt-1">Roll No: {student.rollNumber}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-10">
                    {/* Personal Info */}
                    <div>
                        <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <User size={18} className="text-blue-500" />
                            Personal Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            <Info label="Father's Name" value={student.fatherName} />
                            <Info label="Date of Birth" value={student.dob} />
                            <Info label="Gender" value={student.gender} />
                            <Info label="Nationality" value={student.nationality} />
                            <Info label="CNIC / B-Form" value={student.cnicOrBform} />
                            <Info label="Medical Condition" value={student.medicalCondition || 'N/A'} />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <Phone size={18} className="text-green-500" />
                            Contact Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            <Info label="Email" value={student.email || 'N/A'} />
                            <Info label="Phone Number" value={student.phoneNumber || 'N/A'} />
                            <Info label="WhatsApp Number" value={student.whatsappNumber || 'N/A'} />
                            <Info label="Address" value={student.address || 'N/A'} />
                        </div>
                    </div>

                    {/* Education Info */}
                    <div>
                        <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <Landmark size={18} className="text-purple-500" />
                            Educational Background
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            <Info label="Former Education" value={student.formerEducation || 'N/A'} />
                            <Info label="Previous Institute" value={student.previousInstitute || 'N/A'} />
                            <Info label="Last Exam %" value={student.lastExamPercentage || 'N/A'} />
                        </div>
                    </div>

                    {/* Guardian Info */}
                    <div>
                        <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <User size={18} className="text-pink-500" />
                            Guardian Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            <Info label="Guardian Name" value={student.guardianName || 'N/A'} />
                            <Info label="Guardian Contact" value={student.guardianContact || 'N/A'} />
                            <Info label="Guardian CNIC" value={student.guardianCnic || 'N/A'} />
                            <Info label="Relation" value={student.guardianRelation || 'N/A'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Reusable Info Component
const Info = ({ label, value }: { label: string; value: string }) => (
    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
        <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">{label}</p>
        <p className="text-sm sm:text-base font-medium text-gray-800 break-words">{value}</p>
    </div>
)
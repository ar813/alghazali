import React, { useState, useEffect } from 'react';
import { X, User, BookOpen, Phone, FileText, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ImageCropper from '@/components/ImageCropper/ImageCropper';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any, photoFile: File | null) => Promise<void>;
    initialData?: any; // If provided, it's Edit mode
    loading?: boolean;
}

const TABS = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'guardian', label: 'Guardian', icon: FileText },
];

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, onSave, initialData, loading }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState<any>({});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [cropSource, setCropSource] = useState<string | null>(null);

    // Initialize/Reset Form
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setFormData({ ...initialData });
                setPhotoPreview(initialData.photoUrl || null);
            } else {
                // Create Mode - Default Values (matching original file)
                setFormData({
                    fullName: '',
                    fatherName: '',
                    fatherCnic: '',
                    dob: '',
                    rollNumber: '',
                    grNumber: '',
                    gender: 'male',
                    admissionFor: '1',
                    nationality: 'pakistani',
                    medicalCondition: 'no',
                    cnicOrBform: '',
                    email: '',
                    phoneNumber: '0',
                    whatsappNumber: '0',
                    address: '',
                    formerEducation: '',
                    previousInstitute: '',
                    lastExamPercentage: '',
                    guardianName: '',
                    guardianContact: '0',
                    guardianCnic: '',
                    guardianRelation: '',
                });
                setPhotoPreview(null);
            }
            setPhotoFile(null);
            setActiveTab('personal');
        }
    }, [isOpen, initialData]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropSource(String(reader.result));
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(croppedBlob));
        setShowCropper(false);
    };

    const handleSave = () => {
        onSave(formData, photoFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-6 transition-all duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{initialData ? 'Edit Student' : 'Add New Student'}</h2>
                        <p className="text-sm text-gray-500">Please fill in the details below. Fields in tabs must be completed.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                {/* Tabs - Mobile Optimized */}
                <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide bg-white sticky top-0 z-10 shrink-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap min-w-[80px] sm:min-w-0 justify-center flex-1 sm:flex-none ${activeTab === tab.id
                                ? 'text-primary bg-secondary/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'stroke-[2.5px]' : ''} />
                            <span className="mt-0.5 sm:mt-0">{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                />
                            )}
                        </button>
                    ))}
                </div>


                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white custom-scrollbar">

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Personal Info Tab */}
                            {activeTab === 'personal' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Photo Section */}
                                    <div className="sm:col-span-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:border-blue-300 transition-colors">
                                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
                                                {photoPreview ? (
                                                    <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />

                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Camera size={32} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                                                Change
                                            </div>
                                        </div>
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Click to upload photo</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Father's Name</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.fatherName} onChange={(e) => handleChange('fatherName', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                                        <input type="date" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">CNIC / B-Form</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.cnicOrBform} onChange={(e) => handleChange('cnicOrBform', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Father CNIC</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.fatherCnic} onChange={(e) => handleChange('fatherCnic', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Gender</label>
                                        <div className="flex gap-4 pt-2">
                                            {['male', 'female'].map((g) => (
                                                <label key={g} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="gender" checked={formData.gender === g} onChange={() => handleChange('gender', g)} className="text-blue-600 focus:ring-blue-500" />
                                                    <span className="capitalize">{g}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Nationality</label>
                                        <div className="flex gap-4 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="nationality" checked={formData.nationality === 'pakistani'} onChange={() => handleChange('nationality', 'pakistani')} className="text-blue-600 focus:ring-blue-500" />
                                                <span>Pakistani</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Medical Condition?</label>
                                        <div className="flex gap-4 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="medical" checked={formData.medicalCondition === 'yes'} onChange={() => handleChange('medicalCondition', 'yes')} className="text-blue-600 focus:ring-blue-500" />
                                                <span>Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="medical" checked={formData.medicalCondition === 'no'} onChange={() => handleChange('medicalCondition', 'no')} className="text-blue-600 focus:ring-blue-500" />
                                                <span>No</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Academic Tab */}
                            {activeTab === 'academic' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Admission For Class</label>
                                        <select className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                            value={formData.admissionFor} onChange={(e) => handleChange('admissionFor', e.target.value)}>
                                            {['KG', '1', '2', '3', '4', '5', '6', '7', '8', 'SSCI', 'SSCII'].map(c => (<option key={c} value={c}>{c}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Roll Number</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.rollNumber} onChange={(e) => handleChange('rollNumber', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">GR Number</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.grNumber} onChange={(e) => handleChange('grNumber', e.target.value)} />
                                    </div>
                                    <div className="col-span-full border-t pt-4 mt-2">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4">Previous Education History</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Former Education Class</label>
                                                <select className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                                    value={formData.formerEducation} onChange={(e) => handleChange('formerEducation', e.target.value)}>
                                                    <option value="">Select</option>
                                                    {['KG', '1', '2', '3', '4', '5', '6', '7', '8', 'SSCI', 'SSCII'].map(c => (<option key={c} value={c}>{c}</option>))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Previous Institute</label>
                                                <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    value={formData.previousInstitute} onChange={(e) => handleChange('previousInstitute', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Last Exam Percentage</label>
                                                <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    value={formData.lastExamPercentage} onChange={(e) => handleChange('lastExamPercentage', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Tab */}
                            {activeTab === 'contact' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.phoneNumber} onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                handleChange('phoneNumber', val.startsWith('0') ? val : '0' + val);
                                            }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.whatsappNumber} onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                handleChange('whatsappNumber', val.startsWith('0') ? val : '0' + val);
                                            }} />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Residential Address</label>
                                        <textarea rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                            value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Guardian Tab */}
                            {activeTab === 'guardian' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Guardian Name</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.guardianName} onChange={(e) => handleChange('guardianName', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Guardian Contact</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.guardianContact} onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                handleChange('guardianContact', val.startsWith('0') ? val : '0' + val);
                                            }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Guardian CNIC</label>
                                        <input className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.guardianCnic} onChange={(e) => handleChange('guardianCnic', e.target.value)} />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Relation with Student</label>
                                        <div className="flex flex-wrap gap-4 pt-2">
                                            {['son', 'daughter', 'brother', 'sister', 'other'].map((rel) => (
                                                <label key={rel} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="relation" checked={formData.guardianRelation === rel} onChange={() => handleChange('guardianRelation', rel)} className="text-blue-600 focus:ring-blue-500" />
                                                    <span className="capitalize">{rel}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-gray-500 hidden sm:block">
                        * All changes are saved directly to database
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {loading ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={18} />}

                            {initialData ? 'Update Student' : 'Save Student'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Cropper Modal Overlay */}
            {showCropper && cropSource && (
                <ImageCropper
                    src={cropSource}
                    onCropped={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                />
            )}


        </div>
    );
};

export default StudentFormModal;

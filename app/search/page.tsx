"use client";

import { useState } from 'react';
import { Search as SearchIcon, User, GraduationCap, IdCard, Calendar } from 'lucide-react';
import { client } from '@/sanity/lib/client';
import { getStudentByCnicAndGr } from '@/sanity/lib/queries';
import type { Student } from '@/types/student';
import { onlyDigits } from '@/utils/helpers';
import Image from 'next/image';

export default function SearchPage() {
  const [cnicOrBform, setCnicOrBform] = useState('');
  const [grNumber, setGrNumber] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 5 || i === 12) {
        formatted += '-';
      }
      formatted += digits[i];
    }
    return formatted;
  };

  const handleSearch = async () => {
    if (!cnicOrBform.trim() || !grNumber.trim()) {
      setError('Please enter both CNIC/B-Form and GR Number');
      return;
    }

    const cleanCnic = onlyDigits(cnicOrBform);
    if (cleanCnic.length !== 13) {
      setError('CNIC/B-Form must be 13 digits');
      return;
    }

    setLoading(true);
    setError('');
    setStudent(null);

    try {
      const result = await client.fetch(getStudentByCnicAndGr, {
        cnicOrBform: cleanCnic,
        grNumber: grNumber.trim()
      });
      
      if (result) {
        setStudent(result);
      } else {
        setError('No student found with the provided information. Please check your details and try again.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Student Information Search</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find your child's information using their CNIC/B-Form and GR number. This secure search helps you access your child's academic details.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <SearchIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Search Student</h2>
            </div>

            <div className="space-y-6">
              {/* CNIC/B-Form Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  CNIC/B-Form Number
                </label>
                <div className="relative">
                  <input
                    value={cnicOrBform}
                    onChange={(e) => setCnicOrBform(formatCnic(e.target.value))}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter CNIC/B-Form (e.g., 12345-6789012-3)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter the 13-digit CNIC/B-Form number</p>
              </div>

              {/* GR Number Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  GR Number
                </label>
                <div className="relative">
                  <input
                    value={grNumber}
                    onChange={(e) => setGrNumber(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter GR Number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter your child's GR number</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-lg font-semibold hover:opacity-95 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-5 h-5" />
                    <span>Search Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {student && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Student Found</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Photo */}
                {student.photoUrl && (
                  <div className="md:col-span-2 flex justify-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl w-32 h-32 flex items-center justify-center overflow-hidden">
                      <Image
                        src={student.photoUrl}
                        alt={student.fullName}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><User class="w-12 h-12" /></div>';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Full Name</h3>
                    <p className="text-lg font-medium text-gray-900">{student.fullName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Father's Name</h3>
                    <p className="text-lg font-medium text-gray-900">{student.fatherName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Roll Number</h3>
                    <p className="text-lg font-medium text-gray-900">{student.rollNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">GR Number</h3>
                    <p className="text-lg font-medium text-gray-900">{student.grNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Class</h3>
                    <p className="text-lg font-medium text-gray-900">Class {student.admissionFor}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</h3>
                    <p className="text-lg font-medium text-gray-900">{student.dob}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Gender</h3>
                    <p className="text-lg font-medium text-gray-900 capitalize">{student.gender}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">CNIC/B-Form</h3>
                    <p className="text-lg font-medium text-gray-900">{formatCnic(student.cnicOrBform)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Phone Number</h3>
                    <p className="text-lg font-medium text-gray-900">{student.phoneNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</h3>
                    <p className="text-lg font-medium text-gray-900">{student.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              {(student.guardianName || student.guardianContact) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {student.guardianName && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Guardian Name</h4>
                        <p className="text-base text-gray-900">{student.guardianName}</p>
                      </div>
                    )}
                    {student.guardianContact && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Contact</h4>
                        <p className="text-base text-gray-900">{student.guardianContact}</p>
                      </div>
                    )}
                    {student.guardianRelation && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Relation</h4>
                        <p className="text-base text-gray-900">{student.guardianRelation}</p>
                      </div>
                    )}
                    {student.guardianCnic && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Guardian CNIC</h4>
                        <p className="text-base text-gray-900">{formatCnic(student.guardianCnic)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Important Dates */}
              {(student.issueDate || student.expiryDate) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Card Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {student.issueDate && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Issue Date
                        </h4>
                        <p className="text-base text-gray-900">{student.issueDate}</p>
                      </div>
                    )}
                    {student.expiryDate && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expiry Date
                        </h4>
                        <p className="text-base text-gray-900">{student.expiryDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!student && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">How to Search</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Enter the 13-digit CNIC/B-Form number (with or without dashes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Enter the GR number assigned to your child</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Click "Search Student" to find your child's information</span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-blue-700">
              <strong>Note:</strong> This search is secure and only returns information for the exact match of CNIC/B-Form and GR number.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
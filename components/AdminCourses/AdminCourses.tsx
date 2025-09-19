import { Edit, Plus } from 'lucide-react'
import React from 'react'

const AdminCourses = () => {

    const courses = [
        { id: 1, name: 'Mathematics', code: 'MATH101', instructor: 'Dr. Khan', students: 45, duration: '6 months' },
        { id: 2, name: 'Physics', code: 'PHYS101', instructor: 'Prof. Ahmad', students: 38, duration: '6 months' },
        { id: 3, name: 'Chemistry', code: 'CHEM101', instructor: 'Dr. Hassan', students: 42, duration: '6 months' },
        { id: 4, name: 'English', code: 'ENG101', instructor: 'Ms. Fatima', students: 50, duration: '6 months' },
        { id: 5, name: 'Computer Science', code: 'CS101', instructor: 'Mr. Ali', students: 35, duration: '6 months' },
        { id: 6, name: 'Biology', code: 'BIO101', instructor: 'Dr. Sara', students: 40, duration: '6 months' }
    ];

    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Courses</h2>
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:opacity-90 transition-all">
                    <Plus size={16} />
                    <span>Add Course</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{course.name}</h3>
                            <span className="text-sm text-gray-500">{course.code}</span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Instructor:</span> {course.instructor}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Students:</span> {course.students}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Duration:</span> {course.duration}
                            </p>
                        </div>
                        <div className="mt-4 flex space-x-2">
                            <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg text-sm hover:opacity-90 transition-all">
                                View Details
                            </button>
                            <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">
                                <Edit size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AdminCourses
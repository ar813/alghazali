import { BookOpen, Clock } from 'lucide-react'
import React from 'react'


const subjects = [
  { name: "Mathematics", teacher: "Sir Adil", timing: "9:00 AM", grade: "A-", progress: 85, color: "from-blue-500 to-cyan-500" },
  { name: "Physics", teacher: "Ms. Hira", timing: "10:00 AM", grade: "B+", progress: 78, color: "from-purple-500 to-pink-500" },
  { name: "Chemistry", teacher: "Sir Rehan", timing: "11:00 AM", grade: "A", progress: 92, color: "from-green-500 to-emerald-500" },
  { name: "English", teacher: "Ms. Sara", timing: "12:00 PM", grade: "A", progress: 88, color: "from-orange-500 to-red-500" },
  { name: "Computer Science", teacher: "Sir Imran", timing: "1:00 PM", grade: "A+", progress: 95, color: "from-indigo-500 to-purple-500" },
];

const subjectsByLevel = {
  level1: [
    { name: "Mathematics", teacher: "Sir Adil", timing: "9:00 AM", grade: "A-", progress: 85, color: "from-blue-500 to-cyan-500" },
    { name: "English", teacher: "Ms. Sara", timing: "10:00 AM", grade: "B+", progress: 78, color: "from-orange-500 to-red-500" },
  ],
  level2: [
    { name: "Mathematics", teacher: "Sir Adil", timing: "9:00 AM", grade: "A", progress: 90, color: "from-blue-500 to-cyan-500" },
    { name: "Computer", teacher: "Sir Imran", timing: "10:00 AM", grade: "A+", progress: 93, color: "from-indigo-500 to-purple-500" },
  ],
  level3: [
    { name: "Science", teacher: "Ms. Hira", timing: "9:00 AM", grade: "B", progress: 75, color: "from-green-500 to-emerald-500" },
    { name: "Urdu", teacher: "Ms. Sara", timing: "10:00 AM", grade: "A", progress: 88, color: "from-orange-500 to-red-500" },
  ],
  level4: [
    { name: "Mathematics", teacher: "Sir Adil", timing: "9:00 AM", grade: "A", progress: 89, color: "from-blue-500 to-cyan-500" },
    { name: "English", teacher: "Ms. Sara", timing: "10:00 AM", grade: "A-", progress: 84, color: "from-orange-500 to-red-500" },
  ],
  level5: [
    { name: "Science", teacher: "Ms. Hira", timing: "9:00 AM", grade: "A", progress: 91, color: "from-green-500 to-emerald-500" },
    { name: "Urdu", teacher: "Ms. Sara", timing: "10:00 AM", grade: "A", progress: 86, color: "from-orange-500 to-red-500" },
  ],
  level6: [
    { name: "Computer", teacher: "Sir Imran", timing: "9:00 AM", grade: "A+", progress: 95, color: "from-indigo-500 to-purple-500" },
    { name: "Mathematics", teacher: "Sir Adil", timing: "10:00 AM", grade: "A", progress: 90, color: "from-blue-500 to-cyan-500" },
  ],
  ssci: [
    { name: "Mathematics", teacher: "Sir Adil", timing: "9:00 AM", grade: "A-", progress: 85, color: "from-blue-500 to-cyan-500" },
    { name: "Physics", teacher: "Ms. Hira", timing: "10:00 AM", grade: "B+", progress: 78, color: "from-purple-500 to-pink-500" },
    { name: "Chemistry", teacher: "Sir Rehan", timing: "11:00 AM", grade: "A", progress: 92, color: "from-green-500 to-emerald-500" },
    { name: "English", teacher: "Ms. Sara", timing: "12:00 PM", grade: "A", progress: 88, color: "from-orange-500 to-red-500" },
  ],
  sscii: [
    { name: "Physics", teacher: "Ms. Hira", timing: "9:00 AM", grade: "A", progress: 90, color: "from-purple-500 to-pink-500" },
    { name: "Chemistry", teacher: "Sir Rehan", timing: "10:00 AM", grade: "A", progress: 91, color: "from-green-500 to-emerald-500" },
    { name: "Biology", teacher: "Ms. Huma", timing: "11:00 AM", grade: "A-", progress: 87, color: "from-lime-500 to-green-500" },
    { name: "English", teacher: "Ms. Sara", timing: "12:00 PM", grade: "A", progress: 89, color: "from-orange-500 to-red-500" },
  ],
};


const StudentSubjects = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subjectsByLevel.ssci.map((subj, idx) => (
                <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${subj.color} flex items-center justify-center mb-3 sm:mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <BookOpen size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">{subj.name}</h4>
                    <p className="text-sm sm:text-base text-gray-600 mb-0.5 sm:mb-1">Teacher: {subj.teacher}</p>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                        <Clock size={14} className="sm:w-4 sm:h-4" />
                        {subj.timing}
                    </p>

                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">Current Grade</span>
                            <span className="font-bold text-sm sm:text-base text-gray-800">{subj.grade}</span>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs sm:text-sm text-gray-600">Progress</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-800">{subj.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div
                                    className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${subj.color} transition-all duration-1000`}
                                    style={{ width: `${subj.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default StudentSubjects
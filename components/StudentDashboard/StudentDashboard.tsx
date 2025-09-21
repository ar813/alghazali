import { Student } from '@/types/student';
import { Award, BookOpen, Clock, GraduationCap, Megaphone, TrendingUp } from 'lucide-react';
import React, { useState } from 'react'
import ImageModal from '@/components/ImageModal/ImageModal'

const student = {
  name: "Muhammad Arsalan Khan",
  rollNo: "AGHS-2025-001",
  class: "10th Grade",
  section: "A",
  email: "arsalan@student.com",
  contact: "0312-1234567",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  gpa: "3.85",
  attendance: "92%",
  rank: "12th"
};

const stats = [
  { label: "Current GPA", value: student.gpa, icon: <TrendingUp size={20} />, color: "from-green-400 to-emerald-500" },
  { label: "Attendance", value: student.attendance, icon: <Clock size={20} />, color: "from-blue-400 to-cyan-500" },
  { label: "Class Rank", value: student.rank, icon: <Award size={20} />, color: "from-purple-400 to-pink-500" },
  { label: "Total Subjects", value: "5", icon: <BookOpen size={20} />, color: "from-orange-400 to-red-500" },
];

const subjects = [
  { name: "Mathematics", teacher: "Sir Adil", timing: "9:00 AM", grade: "A-", progress: 85, color: "from-blue-500 to-cyan-500" },
  { name: "Physics", teacher: "Ms. Hira", timing: "10:00 AM", grade: "B+", progress: 78, color: "from-purple-500 to-pink-500" },
  { name: "Chemistry", teacher: "Sir Rehan", timing: "11:00 AM", grade: "A", progress: 92, color: "from-green-500 to-emerald-500" },
  { name: "English", teacher: "Ms. Sara", timing: "12:00 PM", grade: "A", progress: 88, color: "from-orange-500 to-red-500" },
  { name: "Computer Science", teacher: "Sir Imran", timing: "1:00 PM", grade: "A+", progress: 95, color: "from-indigo-500 to-purple-500" },
];

const activities = [
  {
    title: "Science Fair",
    date: "2025-07-20",
    location: "Auditorium",
    type: "academic",
    participants: "150+ students",
    color: "from-emerald-400 to-teal-500"
  },
  {
    title: "Sports Week",
    date: "2025-08-01",
    location: "Playground",
    type: "sports",
    participants: "All grades",
    color: "from-orange-400 to-red-500"
  },
  {
    title: "Debate Contest",
    date: "2025-07-28",
    location: "Main Hall",
    type: "literary",
    participants: "Senior students",
    color: "from-blue-400 to-indigo-500"
  },
];

const notices = [
  {
    title: "Midterm Exams",
    date: "2025-08-10",
    content: "Midterm exams begin soon. Time to start revising!",
    priority: "high",
    type: "exam"
  },
  {
    title: "Science Fair",
    date: "2025-07-20",
    content: "Register for the Science Fair before 18th July.",
    priority: "medium",
    type: "event"
  },
  {
    title: "Independence Day",
    date: "2025-08-14",
    content: "School will remain closed. Flag hoisting ceremony at 8AM.",
    priority: "low",
    type: "holiday"
  }
];

const StudentDashboard = ({data}:{data: Student}) => {
    const [imgOpen, setImgOpen] = useState(false)
    
    return (
        <div className="space-y-8 ">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl sm:shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Welcome back, {data.fullName}! 👋</h3>
                        <p className="text-sm sm:text-base text-blue-100">Ready to conquer today's challenges?</p>
                    </div>
                    <div className="block">
                        <img
                            src={data.photoUrl}
                            alt="Student Avatar"
                            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 sm:border-4 border-white/30 shadow-lg cursor-zoom-in"
                            onClick={() => data.photoUrl && setImgOpen(true)}
                            title="Click to enlarge"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 sm:mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">{stat.value}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Overview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-white/20">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-500" />
                        Today's Classes
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        {subjects.slice(0, 3).map((subj, idx) => (
                            <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r ${subj.color}`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{subj.name}</p>
                                    <p className="text-xs sm:text-sm text-gray-500">{subj.timing}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-white/20">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <Megaphone size={18} className="text-orange-500" />
                        Recent Notices
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        {notices.slice(0, 2).map((notice, idx) => (
                            <div key={idx} className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">{notice.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{notice.date}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-lg border border-white/20">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <GraduationCap size={18} className="text-purple-500" />
                        Upcoming Events
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        {activities.slice(0, 2).map((activity, idx) => (
                            <div key={idx} className="p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-800 text-xs sm:text-sm truncate">{activity.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{activity.date}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <ImageModal open={imgOpen} src={data.photoUrl} alt={data.fullName} onClose={() => setImgOpen(false)} />
        </div>
    )
}

export default StudentDashboard
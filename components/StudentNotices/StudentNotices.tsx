import { Megaphone } from 'lucide-react'
import React from 'react'


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


const StudentNotices = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
                    <Megaphone size={20} className="text-orange-500" />
                    Latest Notices
                </h3>
                <div className="space-y-4 sm:space-y-6">
                    {notices.map((notice, idx) => (
                        <div key={idx} className={`border-l-4 pl-3 sm:pl-6 p-3 sm:p-6 rounded-r-lg sm:rounded-r-2xl shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${notice.priority === 'high' ? 'border-red-500 bg-red-50' :
                            notice.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                                'border-green-500 bg-green-50'
                            }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between mb-2 sm:mb-3">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${notice.priority === 'high' ? 'bg-red-500' :
                                        notice.priority === 'medium' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}></div>
                                    <h4 className="text-base sm:text-lg font-bold text-gray-800">{notice.title}</h4>
                                    <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${notice.type === 'exam' ? 'bg-red-100 text-red-800' :
                                        notice.type === 'event' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {notice.type.toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-500 bg-white/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full self-start sm:self-auto">
                                    {notice.date}
                                </span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{notice.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StudentNotices
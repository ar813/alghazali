import { CalendarCheck, Clock } from 'lucide-react'
import React from 'react'

type Period = { subject: string; time: string }
type Day = { day: string; periods?: Period[] }

const StudentSchedule = ({ schedule }: { schedule: Day[] | null }) => {
    if (!schedule || schedule.length === 0) {
        return (
            <div className="text-center py-8 text-gray-600">No schedule available for your class.</div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-lg sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
                    <CalendarCheck size={20} className="text-blue-500" />
                    Weekly Schedule
                </h3>
                <div className="space-y-3 sm:space-y-4">
                    {schedule.map((day: Day, idx: number) => (
                        <div key={idx} className={`bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">{day.day}</h4>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {day.periods && day.periods.map((period: Period, pIdx: number) => (
                                            <div key={pIdx} className="bg-white rounded-lg p-3 shadow-sm">
                                                <p className="font-medium text-gray-800">{period.subject}</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1"><Clock className="w-4 h-4" /> <span>{period.time}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StudentSchedule
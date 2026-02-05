import { CalendarCheck, Clock } from 'lucide-react'
import React from 'react'

type Period = { subject: string; time: string }
type Day = { day: string; periods?: Period[] }

const StudentSchedule = ({ schedule }: { schedule: Day[] | null }) => {
    if (!schedule || schedule.length === 0) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <CalendarCheck size={28} className="text-neutral-400" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">No schedule available for your class.</p>
            </div>
        )
    }


    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
            {/* Header - Vercel Style */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                    <CalendarCheck size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">Weekly Schedule</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Your class timeline</p>
                </div>
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-10">
                {schedule.map((day: Day, idx: number) => (
                    <div key={idx} className="relative pl-8 sm:pl-10">
                        {/* Day vertical line */}
                        <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-neutral-100 dark:bg-neutral-800" />

                        {/* Day label */}
                        <div className="mb-6 flex items-center gap-2">
                            <div className="absolute left-0 w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center z-10 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                            </div>
                            <h4 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight ml-2">{day.day}</h4>
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-700">
                                {day.periods?.length || 0} Periods
                            </span>
                        </div>

                        {/* Periods Timeline Nodes */}
                        {day.periods && day.periods.length > 0 ? (
                            <div className="space-y-6">
                                {day.periods.map((period: Period, pIdx: number) => (
                                    <div key={pIdx} className="relative pl-6 group">
                                        {/* Period node dot */}
                                        <div className="absolute left-[-26px] top-1.5 w-3.5 h-3.5 rounded-full bg-neutral-200 dark:bg-neutral-800 border-2 border-white dark:border-neutral-950 group-hover:bg-blue-400 transition-colors z-10" />

                                        <div className="bg-white dark:bg-neutral-900/50 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900 shadow-sm hover:shadow-md transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-bold text-neutral-900 dark:text-white text-base mb-1">{period.subject}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>Period {pIdx + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 text-[13px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                                    {period.time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="relative pl-6">
                                <p className="text-sm text-neutral-400 font-medium italic">No periods scheduled for this day</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default StudentSchedule
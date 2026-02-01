import React, { memo } from 'react';
import { Copy, Edit2, Trash2, X, Save, Calendar } from 'lucide-react';
import SchedulePeriod from './SchedulePeriod';
import { ScheduleDoc, ScheduleDay } from './types';

interface ScheduleCardProps {
    schedule: ScheduleDoc;
    copyingSchedule: { fromClass: string; fromDay: string; periods: any[] } | null;
    onDeleteClass: (className: string) => void;
    onAddDay: (className: string) => void;
    onEditDay: (className: string, day: string, periods: any[]) => void;
    onDeleteDay: (className: string, day: string) => void;
    onCopySchedule: (className: string, day: string, periods: any[]) => void;
    onPasteSchedule: (className: string, day: string) => void;
    onCancelCopy: () => void;
}

const ScheduleCard = memo(({
    schedule,
    copyingSchedule,
    onDeleteClass,
    onAddDay,
    onEditDay,
    onDeleteDay,
    onCopySchedule,
    onPasteSchedule,
    onCancelCopy
}: ScheduleCardProps) => {

    const { className, days } = schedule;

    return (
        <div className="group flex flex-col bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-zinc-900 font-bold text-lg shadow-sm">
                            {className}
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white text-base">Class {className}</h4>
                            <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                                {days?.length || 0} Days Scheduled
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onDeleteClass(className)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Delete Entire Class"
                        >
                            <Trash2 size={16} />
                        </button>
                        {/* Add action separated for clarity */}
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                        <button
                            onClick={() => onAddDay(className)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            title="Add Day"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Days List */}
            <div className="p-4 space-y-4 flex-1">
                {days?.map((day: ScheduleDay) => (
                    <div key={day.day} className="relative rounded-lg border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-900/20 p-3 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group/day">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-xs tracking-tight">{day.day}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {copyingSchedule && copyingSchedule.fromClass === className && copyingSchedule.fromDay === day.day ? (
                                    <button
                                        className="p-1 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-md transition-all border border-blue-200 dark:border-blue-900/30 animate-pulse"
                                        onClick={onCancelCopy}
                                        title="Cancel Copy"
                                    >
                                        <X size={12} />
                                    </button>
                                ) : copyingSchedule ? (
                                    <button
                                        className="p-1 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-md transition-all border border-blue-200 dark:border-blue-900/30 animate-pulse"
                                        onClick={() => onPasteSchedule(className, day.day)}
                                        title="Paste Here"
                                    >
                                        <Save size={12} />
                                    </button>
                                ) : (
                                    <button
                                        className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all opacity-0 group-hover/day:opacity-100"
                                        onClick={() => onCopySchedule(className, day.day, day.periods)}
                                        title="Copy Schedule"
                                    >
                                        <Copy size={12} />
                                    </button>
                                )}

                                <button
                                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all opacity-0 group-hover/day:opacity-100"
                                    onClick={() => onEditDay(className, day.day, day.periods)}
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all opacity-0 group-hover/day:opacity-100"
                                    onClick={() => onDeleteDay(className, day.day)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            {day.periods?.map((p, idx) => (
                                <SchedulePeriod key={`${day.day}-${idx}`} index={idx} subject={p.subject} time={p.time} />
                            ))}
                        </div>
                    </div>
                ))}

                {(!days || days.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-6 text-zinc-400 dark:text-zinc-600">
                        <Calendar size={24} className="mb-2 opacity-50" />
                        <p className="text-[10px] font-medium uppercase tracking-widest">No Days Scheduled</p>
                    </div>
                )}
            </div>
        </div>
    );
});

ScheduleCard.displayName = 'ScheduleCard';

export default ScheduleCard;

"use client";

import React from 'react';
import { Edit2, Trash2, Calendar, User, Users, Info, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoticeItemProps {
    notice: any;
    onEdit: (notice: any) => void;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

const NoticeItem = ({ notice, onEdit, onDelete, isDeleting }: NoticeItemProps) => {
    const formattedDate = new Date(notice.createdAt || notice._createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        hour12: true
    });

    const targetLabels = {
        all: "Global",
        class: "Class Based",
        student: "Individual"
    };

    return (
        <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">

                <div className="flex-1 space-y-3 min-w-0">
                    {/* Header Tags */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border",
                            notice.targetType === 'all' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                notice.targetType === 'class' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                            {targetLabels[notice.targetType as keyof typeof targetLabels]}
                        </span>

                        {notice.isEvent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                <Calendar size={10} /> Event
                            </span>
                        )}

                        {notice.isHeadline && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                                <Info size={10} /> Important
                            </span>
                        )}
                    </div>

                    {/* Title & Content */}
                    <div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors capitalize">
                            {notice.title}
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                            {notice.content}
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                            <Calendar size={13} className="text-zinc-400" />
                            {formattedDate}
                        </div>

                        {notice.targetType === 'class' && notice.className && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                                <Users size={13} className="text-zinc-400" />
                                {notice.className}
                            </div>
                        )}

                        {notice.targetType === 'student' && notice.student?.fullName && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium max-w-[150px] truncate">
                                <User size={13} className="text-zinc-400" />
                                {notice.student.fullName}
                            </div>
                        )}
                    </div>

                    {/* Event Specific Sub-card */}
                    {notice.isEvent && notice.eventDate && (
                        <div className="mt-3 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                            <div className="bg-white dark:bg-zinc-800 p-1.5 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <Calendar size={14} className="text-amber-600" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] uppercase font-bold text-zinc-400">Scheduled For</div>
                                <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                    {new Date(notice.eventDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Actions (Desktop) / Horizontal (Mobile) */}
                <div className="flex h-full sm:flex-col items-center gap-1.5 shrink-0 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={() => onEdit(notice)}
                        className="flex-1 sm:flex-none p-2 rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 sm:p-2.5"
                    >
                        <Edit2 size={16} />
                        <span className="text-xs font-semibold sm:hidden">Edit</span>
                    </button>
                    <button
                        onClick={() => onDelete(notice._id)}
                        disabled={isDeleting}
                        className="flex-1 sm:flex-none p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2 sm:p-2.5"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        <span className="text-xs font-semibold sm:hidden">Delete</span>
                    </button>
                    <div className="hidden sm:flex mt-auto pt-2">
                        <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeItem;

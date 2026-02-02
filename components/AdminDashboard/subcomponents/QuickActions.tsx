import React from 'react';
import { Wrench, UserCog, Calendar, FileBarChart2, Megaphone, Activity, Sparkles } from 'lucide-react';

interface QuickActionsProps {
    onActionClick: (id: string) => void;
}

const QuickActions = ({ onActionClick }: QuickActionsProps) => {
    const actions = [
        { id: 'students', label: 'Student Mgmt', icon: UserCog },
        { id: 'schedule', label: 'Academic Cal', icon: Calendar },
        { id: 'reports', label: 'Analytics', icon: FileBarChart2 },
        { id: 'notice', label: 'Broadcasts', icon: Megaphone },
        { id: 'fees', label: 'Revenue', icon: Sparkles },
        { id: 'quiz', label: 'Exam Center', icon: Activity },
    ];

    return (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                    <Wrench size={16} className="text-indigo-500" />
                    Administrative Hub
                </h3>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {actions.map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => onActionClick(btn.id)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-500/5 transition-all group"
                    >
                        <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                            <btn.icon size={20} className="text-neutral-600 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        </div>
                        <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors text-center">{btn.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;

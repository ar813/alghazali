import React from 'react';
import { Activity, Bell } from 'lucide-react';

interface SystemStatusProps {
    health: { ok?: boolean; issues?: string[]; missingEnv?: string[] } | null;
}

const SystemStatus = ({ health }: SystemStatusProps) => {
    return (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30">
                <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                    Infrastructure Status
                </h3>
            </div>
            <div className="p-6">
                {health ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                            <Activity size={18} className={health.ok ? "text-emerald-500" : "text-rose-500"} />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter leading-none">Global Status</p>
                                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{health.ok ? 'Operational' : 'Partial Outage'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter leading-none">Config Audit</p>
                                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{(health.missingEnv || []).length} Missing Vars</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter leading-none">Security Log</p>
                                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{(health.issues || []).length} Alerts</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-neutral-500 flex items-center gap-2 italic uppercase font-bold tracking-tighter">
                        <Bell size={16} className="text-neutral-400" /> Infrastructure telemetry offline
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemStatus;

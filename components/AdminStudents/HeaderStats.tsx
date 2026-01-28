"use client";
import React from 'react';
import { Users, UserCircle2, GraduationCap, UserSquare2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderStatsProps {
    stats: {
        total: number;
        boys: number;
        girls: number;
        kg: number;
    }
}

const HeaderStats = ({ stats }: HeaderStatsProps) => {
    const cards = [
        { label: 'Total Students', value: stats.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Boys', value: stats.boys || 0, icon: UserCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Girls', value: stats.girls || 0, icon: UserSquare2, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'KG Class', value: stats.kg || 0, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${card.bg} dark:bg-neutral-800 ${card.color} dark:text-white`}>
                            <card.icon size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{card.value}</p>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{card.label}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default HeaderStats;

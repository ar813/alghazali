import React from 'react';
import { Users, UserCheck, GraduationCap } from 'lucide-react';

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
        { label: 'Total Students', value: stats.total || 0, icon: Users },
        { label: 'Boys', value: stats.boys || 0, icon: UserCheck },
        { label: 'Girls', value: stats.girls || 0, icon: UserCheck },
        { label: 'KG Class', value: stats.kg || 0, icon: GraduationCap },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {cards.map((card) => (
                <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:border-black/20 group">
                    <div className={`p-2.5 rounded-lg bg-gray-50 text-gray-900 mb-3 group-hover:bg-primary group-hover:text-white transition-colors`}>
                        <card.icon size={20} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 leading-tight">{card.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                </div>
            ))}
        </div>
    );
};

export default HeaderStats;

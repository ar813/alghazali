import React, { useMemo } from 'react';
import { Users, UserCheck, GraduationCap } from 'lucide-react';

interface HeaderStatsProps {
    students: any[];
}

const HeaderStats = ({ students }: HeaderStatsProps) => {
    const stats = useMemo(() => {
        const total = students.length;
        const boys = students.filter(s => (s.gender || '').toLowerCase() === 'male').length;
        const girls = students.filter(s => (s.gender || '').toLowerCase() === 'female').length;

        // Example logic for "New Admissions" (e.g., added recently if we had a date field, here just dummy or admissionFor logic)
        // Let's count students in KG to make it dynamic
        const kgStudents = students.filter(s => s.admissionFor === 'KG').length;

        return { total, boys, girls, kgStudents };
    }, [students]);

    const cards = [
        { label: 'Total Students', value: stats.total, icon: Users },
        { label: 'Boys', value: stats.boys, icon: UserCheck },
        { label: 'Girls', value: stats.girls, icon: UserCheck },
        { label: 'KG Class', value: stats.kgStudents, icon: GraduationCap },
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

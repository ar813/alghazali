import { Calendar } from 'lucide-react'
import React from 'react'

const SchoolEvents = () => {

    const events = [
        { date: "Mar 15", title: "Annual Science Exhibition", type: "Academic" },
        { date: "Mar 22", title: "Parent-Teacher Meeting", type: "Meeting" },
        { date: "Apr 05", title: "Sports Day", type: "Sports" },
        { date: "Apr 12", title: "Cultural Festival", type: "Cultural" }
    ];

    return (
        <section className="py-12 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
                    <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                        Stay updated with our latest events and activities.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {events.map((event, index) => (
                        <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 hover:scale-[1.02]">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="bg-indigo-100 text-indigo-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                                    {event.date}
                                </div>
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            </div>
                            <h3 className="font-bold text-sm sm:text-base mb-1 sm:mb-2">{event.title}</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">{event.type}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default SchoolEvents
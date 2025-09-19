import React from 'react'

const StatsSection = () => {
    return (
        <section className="py-10 sm:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    <div className="text-center p-4 rounded-xl hover:bg-indigo-50 transition-colors duration-300">
                        <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">30+</div>
                        <p className="text-sm sm:text-base text-gray-600">Years of Excellence</p>
                    </div>
                    <div className="text-center p-4 rounded-xl hover:bg-indigo-50 transition-colors duration-300">
                        <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">1000+</div>
                        <p className="text-sm sm:text-base text-gray-600">Students</p>
                    </div>
                    <div className="text-center p-4 rounded-xl hover:bg-indigo-50 transition-colors duration-300">
                        <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">95%</div>
                        <p className="text-sm sm:text-base text-gray-600">Success Rate</p>
                    </div>
                    <div className="text-center p-4 rounded-xl hover:bg-indigo-50 transition-colors duration-300">
                        <div className="text-3xl sm:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">100+</div>
                        <p className="text-sm sm:text-base text-gray-600">Qualified Teachers</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default StatsSection
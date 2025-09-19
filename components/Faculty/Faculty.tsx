import React from 'react'

const Faculty = () => {

    const faculty = [
        {
            name: "Dr. Amna Siddiqui",
            role: "Principal",
            qualification: "PhD in Education",
            experience: "15+ years",
            image: "https://images.unsplash.com/photo-1494790108755-2616c64c6f4e?w=150&h=150&fit=crop&crop=face"
        },
        {
            name: "Prof. Ahmed Ali",
            role: "Mathematics Department Head",
            qualification: "MSc Mathematics",
            experience: "12+ years",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        },
        {
            name: "Ms. Zara Sheikh",
            role: "Science Department Head",
            qualification: "MSc Physics",
            experience: "10+ years",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
        }
    ];

    return (
        <section id="faculty" className="py-12 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Distinguished Faculty</h2>
                    <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                        Our experienced and dedicated teachers are committed to providing the highest quality education and mentorship to our students.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {faculty.map((member, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center hover:scale-[1.02]">
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-20 sm:w-24 h-20 sm:h-24 rounded-full mx-auto mb-4 sm:mb-6 object-cover ring-2 ring-indigo-50"
                            />
                            <h3 className="text-lg sm:text-xl font-bold mb-2">{member.name}</h3>
                            <p className="text-indigo-600 font-semibold mb-2 text-sm sm:text-base">{member.role}</p>
                            <p className="text-gray-600 mb-1 text-sm sm:text-base">{member.qualification}</p>
                            <p className="text-gray-500 text-xs sm:text-sm">{member.experience}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Faculty
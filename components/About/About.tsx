import { Award, BookOpen, Star, Users } from 'lucide-react'
import React from 'react'

const About = () => {

    const achievements = [
        { icon: <Award className="w-6 h-6" />, title: "Top 10 Schools in Karachi", year: "2024" },
        { icon: <Star className="w-6 h-6" />, title: "70% Matric Pass Rate", year: "2024" },
        { icon: <Users className="w-6 h-6" />, title: "1500+ Happy Students", year: "Current" },
        { icon: <BookOpen className="w-6 h-6" />, title: "Excellence in Science Fair", year: "2024" }
    ];


    return (
        <section id="about" className="py-20 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Al Ghazali High School</h2>
                    <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                        Established in 1993, Al Ghazali High School has been a beacon of educational excellence in Karachi, combining modern pedagogical approaches with Islamic values to create well-rounded individuals.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Our Mission</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            To provide quality education that nurtures intellectual growth, character development, and Islamic values, preparing students for success in this world and the hereafter.
                        </p>
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Our Vision</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            To be the leading educational institution in Pakistan, recognized for academic excellence, moral integrity, and producing future leaders who contribute positively to society.
                        </p>
                    </div>

                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Our Values</h3>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            Integrity, Excellence, Innovation, Compassion, and Responsibility guide everything we do, ensuring our students develop strong character alongside academic success.
                        </p>
                    </div>
                </div>

                {/* Achievements */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
                    <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Our Achievements</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    {achievement.icon}
                                </div>
                                <h4 className="font-semibold mb-1 text-sm sm:text-base">{achievement.title}</h4>
                                <p className="text-xs sm:text-sm text-blue-100">{achievement.year}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About
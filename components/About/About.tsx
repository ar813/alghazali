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
        <section id="about" className="py-16 bg-background border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10 sm:mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">About Al Ghazali High School</h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
                        Established in 1993, Al Ghazali High School has been a beacon of educational excellence in Karachi, combining modern pedagogical approaches with Islamic values to create well-rounded individuals.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 mb-10 sm:mb-12">
                    <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center mb-4">
                            <Award className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-foreground tracking-tight">Our Mission</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To provide quality education that nurtures intellectual growth, character development, and Islamic values, preparing students for success in this world and the hereafter.
                        </p>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center mb-4">
                            <Star className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-foreground tracking-tight">Our Vision</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            To be the leading educational institution in Pakistan, recognized for academic excellence, moral integrity, and producing future leaders who contribute positively to society.
                        </p>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center mb-4">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-foreground tracking-tight">Our Values</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Integrity, Excellence, Innovation, Compassion, and Responsibility guide everything we do, ensuring our students develop strong character alongside academic success.
                        </p>
                    </div>
                </div>

                <div className="bg-secondary/20 rounded-2xl p-8 sm:p-12 border border-border relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-enterprise opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                        <div className="text-left">
                            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">Our Achievements</h3>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">Legacy of Excellence since 1993</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="flex flex-col items-start p-2 group transition-all duration-300">
                                <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center mb-6 shadow-enterprise group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300">
                                    <span className="text-primary">{achievement.icon}</span>
                                </div>
                                <h4 className="font-bold text-lg text-foreground mb-1 tracking-tight">{achievement.title}</h4>
                                <p className="text-sm font-mono text-muted-foreground/80">{achievement.year}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About
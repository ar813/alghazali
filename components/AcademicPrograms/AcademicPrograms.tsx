import React from 'react'
import { Microscope, Monitor, Ruler, BookOpen, PenTool, Globe } from 'lucide-react'

const AcademicPrograms = () => {
  return (
    <section id="academics" className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">Academic Programs</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
            Our comprehensive curriculum is designed to challenge students while providing them with the knowledge and skills needed for success in higher education and beyond.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              title: "Science Stream",
              subjects: ["Physics", "Chemistry", "Biology", "Mathematics"],
              description: "Comprehensive science education with modern lab facilities and hands-on experiments.",
              icon: <Microscope className="w-8 h-8" />,
              color: "from-blue-500 to-cyan-500"
            },
            {
              title: "Computer Science",
              subjects: ["Programming", "Web Development", "Database", "AI Basics"],
              description: "Cutting-edge computer education preparing students for the digital future.",
              icon: <Monitor className="w-8 h-8" />,
              color: "from-purple-500 to-pink-500"
            },
            {
              title: "Mathematics",
              subjects: ["Algebra", "Geometry", "Calculus", "Statistics"],
              description: "Strong mathematical foundation with practical applications and problem-solving.",
              icon: <Ruler className="w-8 h-8" />,
              color: "from-green-500 to-teal-500"
            },
            {
              title: "Islamic Studies",
              subjects: ["Quran", "Hadith", "Fiqh", "Islamic History"],
              description: "Deep understanding of Islamic teachings and values for moral development.",
              icon: <BookOpen className="w-8 h-8" />,
              color: "from-amber-500 to-orange-500"
            },
            {
              title: "English Literature",
              subjects: ["Grammar", "Literature", "Creative Writing", "Public Speaking"],
              description: "Excellent command of English language and literature for global communication.",
              icon: <PenTool className="w-8 h-8" />,
              color: "from-indigo-500 to-purple-500"
            },
            {
              title: "Social Studies",
              subjects: ["History", "Geography", "Civics", "Economics"],
              description: "Understanding of society, culture, and global affairs for informed citizenship.",
              icon: <Globe className="w-8 h-8" />,
              color: "from-red-500 to-pink-500"
            }
          ].map((program, index) => (
            <div key={index} className="bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <div className={`h-1 bg-gradient-to-r ${program.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="p-6 sm:p-7">
                <div className="mb-4 text-primary opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{program.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground tracking-tight">{program.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">{program.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">Key Subjects:</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {program.subjects.map((subject, idx) => (
                      <span key={idx} className="px-2 sm:px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs sm:text-sm border border-border/50">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AcademicPrograms
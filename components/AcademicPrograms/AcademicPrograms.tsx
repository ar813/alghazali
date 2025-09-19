import React from 'react'

const AcademicPrograms = () => {
  return (
    <section id="academics" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Academic Programs</h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Our comprehensive curriculum is designed to challenge students while providing them with the knowledge and skills needed for success in higher education and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Science Stream",
                subjects: ["Physics", "Chemistry", "Biology", "Mathematics"],
                description: "Comprehensive science education with modern lab facilities and hands-on experiments.",
                icon: "🔬",
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "Computer Science",
                subjects: ["Programming", "Web Development", "Database", "AI Basics"],
                description: "Cutting-edge computer education preparing students for the digital future.",
                icon: "💻",
                color: "from-purple-500 to-pink-500"
              },
              {
                title: "Mathematics",
                subjects: ["Algebra", "Geometry", "Calculus", "Statistics"],
                description: "Strong mathematical foundation with practical applications and problem-solving.",
                icon: "📐",
                color: "from-green-500 to-teal-500"
              },
              {
                title: "Islamic Studies",
                subjects: ["Quran", "Hadith", "Fiqh", "Islamic History"],
                description: "Deep understanding of Islamic teachings and values for moral development.",
                icon: "📚",
                color: "from-amber-500 to-orange-500"
              },
              {
                title: "English Literature",
                subjects: ["Grammar", "Literature", "Creative Writing", "Public Speaking"],
                description: "Excellent command of English language and literature for global communication.",
                icon: "✍️",
                color: "from-indigo-500 to-purple-500"
              },
              {
                title: "Social Studies",
                subjects: ["History", "Geography", "Civics", "Economics"],
                description: "Understanding of society, culture, and global affairs for informed citizenship.",
                icon: "🌍",
                color: "from-red-500 to-pink-500"
              }
            ].map((program, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className={`h-2 bg-gradient-to-r ${program.color}`} />
                <div className="p-6 sm:p-8">
                  <div className="text-3xl sm:text-4xl mb-4">{program.icon}</div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{program.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">{program.description}</p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-gray-700">Key Subjects:</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {program.subjects.map((subject, idx) => (
                        <span key={idx} className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm">
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
import { Star } from 'lucide-react'
import React from 'react'

const Testimonials = () => {

    const testimonials = [
    {
      name: "Sarah Ahmed",
      role: "Parent",
      text: "Al Ghazali has provided my daughter with an excellent foundation in both academics and Islamic values. The teachers are dedicated and caring.",
      rating: 5
    },
    {
      name: "Dr. Muhammad Hassan",
      role: "Alumni Parent",
      text: "Both my sons graduated from Al Ghazali and are now successful engineers. The school's science program is outstanding.",
      rating: 5
    },
    {
      name: "Fatima Khan",
      role: "Class of 2023",
      text: "The supportive environment and quality education helped me achieve my dreams. I'm now studying at NED University.",
      rating: 5
    }
  ];

  
    return (
        <section className="py-12 sm:py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Our Community Says</h2>
                    <p className="text-base sm:text-xl text-blue-100 max-w-3xl mx-auto px-2">
                        Hear from our students, parents, and alumni about their experiences at Al Ghazali High School.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:bg-white/20 transition-colors duration-300">
                            <div className="flex mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                            <div>
                                <p className="font-semibold text-sm sm:text-base">{testimonial.name}</p>
                                <p className="text-blue-200 text-xs sm:text-sm">{testimonial.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Testimonials
import React from 'react'

const Faculty = () => {

    const faculty = [
        {
            name: "Molana Noor ul Bashar",
            // role: "Administration Head",
            qualification: "Shaik ul Hadees",
            // experience: "15+ years",
            image: "https://images.unsplash.com/photo-1494790108755-2616c64c6f4e?w=150&h=150&fit=crop&crop=face"
        },
        {
            name: "Dr. Zakariya Rasheed",
            // role: "Principal of the school",
            qualification: "Principal of the school",
            // experience: "12+ years",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        },
        {
            name: "Molana Shabbir Sahab",
            // role: "Science Department Head",
            qualification: "Director of Administration",
            // experience: "10+ years",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
        }
    ];

    const getInitial = (name: string) => {
        const n = name?.trim()
        return n ? n.charAt(0).toUpperCase() : 'A'
    }

    return (
        <section id="faculty" className="py-16 bg-background border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10 sm:mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">Our Distinguished Faculty</h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-2">
                        Our experienced and dedicated teachers are committed to providing the highest quality education and mentorship to our students.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6">
                    {faculty.map((member, index) => (
                        <div key={index} className="bg-card border border-border rounded-xl hover:border-primary/20 hover:shadow-sm transition-all duration-300 p-6 sm:p-7 text-center group">
                            <div className="w-20 h-20 rounded-full mx-auto mb-5 bg-secondary border border-border text-foreground flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                                {getInitial(member.name)}
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-lg font-bold mb-1 text-foreground tracking-tight">{member.name}</h3>
                            <p className="text-muted-foreground mb-0 text-sm">{member.qualification}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Faculty
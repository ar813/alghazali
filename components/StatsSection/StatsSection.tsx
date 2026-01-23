import React from 'react'

const StatsSection = () => {
    return (
        <section className="py-24 border-y border-border bg-background/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center p-6">
                        <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2 tracking-tight">30+</div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Years of Excellence</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2 tracking-tight">1000+</div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Students</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2 tracking-tight">95%</div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Success Rate</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2 tracking-tight">100+</div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Qualified Teachers</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default StatsSection
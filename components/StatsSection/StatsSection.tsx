import React from 'react'
import { History, Users, TrendingUp, GraduationCap } from 'lucide-react'

const StatsSection = () => {
    return (
        <section className="py-12 border-y border-border bg-secondary/5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-enterprise opacity-[0.03] pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    <div className="text-center p-4 sm:p-6 group">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/5 rounded-xl mb-4 border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                            <History className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 tracking-tighter">30+</div>
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Years Of Excellence</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 group">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/5 rounded-xl mb-4 border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 tracking-tighter">1000+</div>
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Active Students</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 group">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/5 rounded-xl mb-4 border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 tracking-tighter">95%</div>
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Success Rate</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 group">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/5 rounded-xl mb-4 border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 tracking-tighter">100+</div>
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Qualified Teachers</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default StatsSection
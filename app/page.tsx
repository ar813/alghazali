"use client"

import NavBar from '@/components/NavBar/NavBar';
import HeroSection from '@/components/HeroSection/HeroSection';
import StatsSection from '@/components/StatsSection/StatsSection';
import About from '@/components/About/About';
import AcademicPrograms from '@/components/AcademicPrograms/AcademicPrograms';
import Faculty from '@/components/Faculty/Faculty';
import SchoolEvents from '@/components/SchoolEvents/SchoolEvents';
import AdmissionDetail from '@/components/AdmissionDetail/AdmissionDetail';
import Footer from '@/components/Footer/Footer';
import Contact from '@/components/Contact/Contact';
import { SectionReveal, ScrollProgress } from '@/components/ScrollEffects/SectionReveal';
import SchemaOrg from '@/components/SEO/SchemaOrg';

export default function HomePage() {



  return (
    <main className="min-h-screen bg-background relative flex flex-col w-full overflow-x-hidden">
      <SchemaOrg />

      {/* Vercel Grid Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>

      <ScrollProgress />
      <NavBar />

      <HeroSection />

      <SectionReveal>
        <SchoolEvents />
      </SectionReveal>

      <SectionReveal>
        <About />
      </SectionReveal>

      <SectionReveal>
        <AcademicPrograms />
      </SectionReveal>

      <SectionReveal>
        <Faculty />
      </SectionReveal>

      <SectionReveal>
        <StatsSection />
      </SectionReveal>

      <SectionReveal>
        <AdmissionDetail />
      </SectionReveal>

      <SectionReveal>
        <Contact />
      </SectionReveal>

      <Footer />

    </main>
  );
}
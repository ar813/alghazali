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

export default function HomePage() {

  

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      <NavBar />
      <HeroSection />
      <SchoolEvents />
      <About />
      <AcademicPrograms />
      <Faculty />
      <StatsSection />
      <AdmissionDetail />      
      <Contact />
      <Footer />
      
    </main>
  );
}
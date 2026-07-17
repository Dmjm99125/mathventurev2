import React from 'react';
import { TopNav } from '@/components/layout';
import { Users } from 'lucide-react';

export function About() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url('/assets/images/INDBG.jpg')` }}
    >
      <TopNav />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 md:left-40 bg-jungle-yellow/20 w-32 h-32 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 md:right-40 bg-jungle-orange/20 w-48 h-48 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/10 w-96 h-96 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-jungle-yellow/30 w-64 h-64 rounded-full blur-3xl -z-10" />
            <div className="inline-flex items-center justify-center p-3 bg-jungle-orange text-white rounded-2xl shadow-lg rotate-[-5deg] hover:rotate-0 transition-transform mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-foreground mb-4">
              About The Researchers
            </h2>
            <p className="text-xl md:text-2xl font-bold text-muted-foreground max-w-2xl mx-auto">
              The creative minds and developers behind MathVenture.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start justify-center">
            {/* Main Researcher (MR) */}
            <div className="flex flex-col items-center gap-6 bg-white/70 backdrop-blur-md p-8 rounded-[3rem] shadow-xl border-4 border-white transform transition-transform hover:scale-105">
              <img src="/assets/images/MR.png" alt="Researcher MR" className="w-[300px] sm:w-[400px] object-contain rounded-2xl" />
              <img src="/assets/images/MR.gif" alt="Researcher Details" className="w-[300px] sm:w-[400px] object-contain rounded-2xl" />
              <img src="/assets/images/re3.png" alt="Avatar" className="w-[120px] object-contain" />
            </div>

            {/* Team Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
              <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                <img src="/assets/images/gy.png" alt="Researcher GY" className="w-[200px] object-contain rounded-2xl" />
                <img src="/assets/images/re4.gif" alt="Avatar" className="w-[150px] object-contain mt-auto" />
              </div>
              <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                <img src="/assets/images/alr.png" alt="Researcher ALR" className="w-[200px] object-contain rounded-2xl" />
                <img src="/assets/images/re5.gif" alt="Avatar" className="w-[150px] object-contain mt-auto" />
              </div>
              <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                <img src="/assets/images/dmm.png" alt="Researcher DMM" className="w-[200px] object-contain rounded-2xl" />
                <img src="/assets/images/re6.gif" alt="Avatar" className="w-[150px] object-contain mt-auto" />
              </div>
              <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                <img src="/assets/images/gv.png" alt="Researcher GV" className="w-[200px] object-contain rounded-2xl" />
                <img src="/assets/images/re7.gif" alt="Avatar" className="w-[150px] object-contain mt-auto" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

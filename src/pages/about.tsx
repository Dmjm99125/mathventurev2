import React, { useState } from 'react';
import { TopNav } from '@/components/layout';
import { Users, Home, BookOpen, Github, FileText, Lock, ChevronDown } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Tab = 'mathventure' | 'counting';

const TABS: { value: Tab; label: string }[] = [
  { value: 'mathventure', label: 'MathVenture' },
  { value: 'counting', label: 'Counting the Uncounted' },
];

export function About() {
  const [activeTab, setActiveTab] = useState<Tab>('mathventure');

  const activeLabel = TABS.find(t => t.value === activeTab)?.label ?? '';

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url('/assets/images/INDBG.jpg')` }}
    >
      <TopNav />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Top Right Action Bar */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 z-20">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 font-bold bg-white/70 backdrop-blur-md border-white/50 hover:bg-white/90">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-bold bg-white/70 backdrop-blur-md border-white/50 hover:bg-white/90">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Papers</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 font-bold">
              <DropdownMenuItem asChild>
                <a href="/assets/papers/FIN-GROUP1-RESEARCH-MANUSCRIPT.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer w-full text-primary">
                  <FileText className="w-4 h-4" />
                  <span>Counting the Uncounted</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="flex items-center gap-2 justify-between w-full">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>MathVenture</span>
                </div>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">WIP</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-2 font-bold bg-white/70 backdrop-blur-md border-white/50 hover:bg-white/90" asChild>
            <a href="https://github.com/Thalanas110/MathVenture" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Repo</span>
            </a>
          </Button>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 md:left-40 bg-jungle-yellow/20 w-32 h-32 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 md:right-40 bg-jungle-orange/20 w-48 h-48 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/10 w-96 h-96 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-jungle-yellow/30 w-64 h-64 rounded-full blur-3xl -z-10" />
            <div className="inline-flex items-center justify-center p-3 bg-jungle-orange text-white rounded-2xl shadow-lg rotate-[-5deg] hover:rotate-0 transition-transform mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-foreground mb-4">
              About The Researchers
            </h2>
            <p className="text-xl md:text-2xl font-bold text-muted-foreground max-w-2xl mx-auto">
              The creative mind and developer behind MathVenture.
            </p>
          </div>

          {/* Tab Switcher — pill tabs on md+, dropdown on mobile */}
          <div className="flex justify-center mb-10">
            {/* Mobile dropdown */}
            <div className="relative md:hidden">
              <select
                value={activeTab}
                onChange={e => setActiveTab(e.target.value as Tab)}
                className="appearance-none bg-white/70 backdrop-blur-md border-2 border-white rounded-2xl px-5 py-3 pr-10 font-bold text-base shadow-lg text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-jungle-orange/50"
              >
                {TABS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            {/* Desktop pill tabs */}
            <div className="hidden md:inline-flex bg-white/60 backdrop-blur-md border-2 border-white rounded-2xl p-1.5 gap-1 shadow-lg">
              {TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setActiveTab(t.value)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm md:text-base transition-all duration-300 ${activeTab === t.value
                      ? 'bg-jungle-orange text-white shadow-md scale-105'
                      : 'text-muted-foreground hover:bg-white/70'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* MathVenture Tab — only Donna May Mesina */}
          {activeTab === 'mathventure' && (
            <div className="flex justify-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2 max-w-xs w-full">
                <img src="/assets/images/dmm.png" alt="Donna May Mesina" className="w-[220px] object-contain rounded-2xl" />
                <img src="/assets/images/re6.gif" alt="Avatar" className="w-[150px] object-contain mt-auto" />
              </div>
            </div>
          )}

          {/* Counting the Uncounted Tab — MR left (tall), 2x2 grid right with DMM first */}
          {activeTab === 'counting' && (
            <div className="flex justify-center animate-in fade-in duration-300">
              <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-stretch">

                {/* Left: Ma'am Rachelle — tall card */}
                <div className="flex flex-col items-center justify-start gap-2 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2 md:w-64">
                  <img src="/assets/images/MR.png" alt="Ma'am Rachelle Ignacio" className="w-[200px] object-contain rounded-2xl" />
                  <img src="/assets/images/MR.gif" alt="Details" className="w-[200px] object-contain" />
                  <img src="/assets/images/re3.png" alt="Avatar" className="w-[100px] object-contain" />
                </div>

                {/* Right: 2×2 grid — DMM first */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                    <img src="/assets/images/dmm.png" alt="Donna May Mesina" className="w-full max-w-[180px] object-contain rounded-2xl" />
                    <img src="/assets/images/re6.gif" alt="Avatar" className="w-[130px] object-contain mt-auto" />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                    <img src="/assets/images/gy.png" alt="Researcher GY" className="w-full max-w-[180px] object-contain rounded-2xl" />
                    <img src="/assets/images/re4.gif" alt="Avatar" className="w-[130px] object-contain mt-auto" />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                    <img src="/assets/images/alr.png" alt="Researcher ALR" className="w-full max-w-[180px] object-contain rounded-2xl" />
                    <img src="/assets/images/re5.gif" alt="Avatar" className="w-[130px] object-contain mt-auto" />
                  </div>
                  <div className="flex flex-col items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white transform transition-transform hover:-translate-y-2">
                    <img src="/assets/images/gv.png" alt="Researcher GV" className="w-full max-w-[180px] object-contain rounded-2xl" />
                    <img src="/assets/images/re7.gif" alt="Avatar" className="w-[130px] object-contain mt-auto" />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

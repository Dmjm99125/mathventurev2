import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui';
import { Compass, Sparkles, Map as MapIcon, GraduationCap, Users } from 'lucide-react';
import { TopNav } from '@/components/layout';

export function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        setLocation('/teacher');
      } else {
        setLocation('/student');
      }
    }
  }, [user, setLocation]);

  if (isLoading || user) return null;

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.47), rgba(255, 255, 255, 0.74)), url('/assets/images/INDBG.jpg')` }}
    >
      <TopNav />

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">

        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 md:left-40 bg-jungle-yellow/20 w-32 h-32 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 md:right-40 bg-jungle-orange/20 w-48 h-48 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/10 w-96 h-96 rounded-full blur-3xl -z-10" />

        <div className="mb-8 inline-flex items-center justify-center p-4 bg-jungle-orange text-white rounded-3xl shadow-xl rotate-3 hover:rotate-0 transition-transform">
          <Compass className="w-12 h-12" />
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground mb-6 max-w-4xl leading-tight">
          A wild jungle adventure for <span className="text-jungle-orange relative">
            curious minds
            <Sparkles className="absolute -top-6 -right-6 text-jungle-yellow w-8 h-8 animate-pulse" />
          </span>
        </h1>

        <p className="text-xl md:text-2xl font-bold text-muted-foreground mb-12 max-w-2xl">
          Master colors, shapes, numbers, and sequencing through fun, bite-sized mini-games. Built for kids 4-7, loved by teachers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md mx-auto">
          <Link href="/signup">
            <Button size="lg" variant="jungle" className="w-full sm:w-auto min-w-[200px] text-lg gap-2">
              <MapIcon className="w-5 h-5" /> Start Exploring
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] text-lg gap-2 bg-white">
              <GraduationCap className="w-5 h-5" />Login
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <FeatureCard
            title="Colors & Shapes"
            desc="Identify the colorful jungle friends and shapes hiding in the foliage."
            color="bg-primary/10 text-primary"
          />
          <FeatureCard
            title="Numbers 1-10"
            desc="Count bananas, match pairs, and learn number sequencing."
            color="bg-jungle-orange/10 text-jungle-orange"
          />
          <FeatureCard
            title="Teacher Dashboard"
            desc="Track student progress, assign lessons, and identify who needs help."
            color="bg-accent/20 text-foreground"
          />
        </div>

        <div className="mt-16 text-center">
          <Link href="/about">
            <Button size="lg" variant="outline" className="text-lg gap-2 bg-white">
              <Users className="w-5 h-5" /> Meet The Researchers
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, desc, color }: { title: string, desc: string, color: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white border-2 border-border shadow-sm hover:-translate-y-1 transition-transform">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
        <Sparkles className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground font-bold">{desc}</p>
    </div>
  );
}


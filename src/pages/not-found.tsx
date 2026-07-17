import { Link } from 'wouter';
import { Button } from '@/components/ui';
import { Compass, Home } from 'lucide-react';
import { TopNav } from '@/components/layout';

export default function NotFound() {
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
          Oops! <span className="text-jungle-orange relative">
            Lost in the jungle?
          </span>
        </h1>

        <p className="text-xl md:text-2xl font-bold text-muted-foreground mb-12 max-w-2xl">
          We couldn't find the page you're looking for. It might have moved or the link is broken.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md mx-auto">
          <Link href="/">
            <Button size="lg" variant="jungle" className="w-full sm:w-auto min-w-[200px] text-lg gap-2">
              <Home className="w-5 h-5" /> Return Home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

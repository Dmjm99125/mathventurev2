import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from './ui';

interface GameLayoutProps {
  children: React.ReactNode;
  topic?: string;
  title?: string;
  onExit?: () => void;
}

export function GameLayout({ children, topic, title, onExit }: GameLayoutProps) {
  const [, setLocation] = useLocation();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      setLocation('/student/lessons');
    }
  };

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col pt-16">
      <div className="h-16 border-b-2 border-border bg-white flex items-center px-4 justify-between shrink-0 shadow-sm">
        <Button variant="ghost" size="sm" onClick={handleExit} className="gap-2 font-bold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Exit
        </Button>
        <div className="flex flex-col items-center text-center max-w-[60%]">
          {topic && <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider capitalize">{topic}</span>}
          {title && <span className="font-display font-bold text-lg leading-none truncate w-full">{title}</span>}
        </div>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-auto bg-[url('/assets/images/1bg.jpg')] bg-cover bg-center bg-fixed relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        <div className="relative z-10 h-full container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
}

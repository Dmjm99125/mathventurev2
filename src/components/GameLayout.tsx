import React from 'react';
import { ArrowLeft, Video, BookOpen, Gamepad2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from './ui';

export type LessonStage = 'video' | 'lesson' | 'quiz';

interface GameLayoutProps {
  children: React.ReactNode;
  topic?: string;
  title?: string;
  stage?: LessonStage;
  onExit?: () => void;
}

const STAGES: { key: LessonStage; label: string; Icon: React.ElementType }[] = [
  { key: 'video',  label: 'Video',      Icon: Video     },
  { key: 'lesson', label: 'Lesson',     Icon: BookOpen  },
  { key: 'quiz',   label: 'Activities', Icon: Gamepad2  },
];

export function GameLayout({ children, topic, title, stage, onExit }: GameLayoutProps) {
  const [, setLocation] = useLocation();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      setLocation('/student/lessons');
    }
  };

  const activeIdx = stage ? STAGES.findIndex(s => s.key === stage) : -1;

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col">
      <div className="h-16 border-b-2 border-border bg-white flex items-center px-4 justify-between shrink-0 shadow-sm">
        <Button variant="ghost" size="sm" onClick={handleExit} className="gap-2 font-bold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Exit
        </Button>

        {/* Stage progress indicator */}
        {stage ? (
          <div className="flex items-center gap-1">
            {STAGES.map((s, i) => {
              const isActive = i === activeIdx;
              const isDone = i < activeIdx;
              return (
                <React.Fragment key={s.key}>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : isDone
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    <s.Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-4 h-0.5 rounded-full ${i < activeIdx ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center max-w-[60%]">
            {topic && <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider capitalize">{topic}</span>}
            {title && <span className="font-display font-bold text-lg leading-none truncate w-full">{title}</span>}
          </div>
        )}

        <div className="w-20 text-right">
          {topic && stage && (
            <span className="text-xs font-bold text-muted-foreground capitalize truncate">{topic}</span>
          )}
        </div>
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


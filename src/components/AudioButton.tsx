import React, { useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from './ui';

interface AudioButtonProps {
  src: string;
  className?: string;
}

export function AudioButton({ src, className = '' }: AudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    } else if (audioRef.current.src !== src) {
      audioRef.current.src = src;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.error("Audio playback failed", e));
  };

  return (
    <Button variant="outline" size="icon" className={`h-16 w-16 rounded-full shadow-sm hover:scale-105 transition-transform ${className}`} onClick={play}>
      <Volume2 className="h-8 w-8 text-primary" />
    </Button>
  );
}

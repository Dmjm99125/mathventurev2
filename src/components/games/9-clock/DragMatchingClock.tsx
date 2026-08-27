import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare' | 'pop' | 'pick') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'correct') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'fanfare') {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
      gain.gain.setValueAtTime(0.2, now + (idx * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + (idx * 0.1)); osc.stop(now + (idx * 0.1) + 0.4);
    });
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'pick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  }
};

// SVG Clock Component mimicking the miniature clocks
const MiniClock = ({ hour }: { hour: number }) => {
  const hourAngle = (hour % 12) * 30; 
  
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-[92px] w-[92px] md:h-[120px] md:w-[120px] drop-shadow-md pointer-events-none"
    >
      <circle cx="60" cy="60" r="55" fill="white" stroke="#29b6f6" strokeWidth="6" />
      
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
        const angle = (num * Math.PI) / 6 - Math.PI / 2;
        const x = 60 + Math.cos(angle) * 42;
        const y = 60 + Math.sin(angle) * 42;
        return (
          <text 
            key={num}
            x={x} 
            y={y} 
            fill="#00838f" 
            fontSize="12" 
            fontWeight="bold" 
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            textAnchor="middle" 
            alignmentBaseline="central"
          >
            {num}
          </text>
        );
      })}
      
      <line x1="60" y1="60" x2="60" y2="20" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      
      <line 
        x1="60" y1="60" 
        x2="60" y2="35" 
        stroke="#d32f2f" 
        strokeWidth="5" 
        strokeLinecap="round" 
        transform={`rotate(${hourAngle} 60 60)`}
      />
      
      <circle cx="60" cy="60" r="4" fill="#333" />
    </svg>
  );
};

interface DragMatchingClockProps {
  onComplete?: () => void;
  allowSkip?: boolean;
}

export function DragMatchingClock({ onComplete, allowSkip = true }: DragMatchingClockProps) {
  const MAX_SCORE = 10;
  const [score, setScore] = useState(0);
  const [targetHour, setTargetHour] = useState(12);
  const [options, setOptions] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [dragState, setDragState] = useState<'idle' | 'dragging' | 'success'>('idle');

  const dropZoneRef = useRef<HTMLDivElement>(null);

  const setupRound = () => {
    const hour = Math.floor(Math.random() * 12) + 1;
    setTargetHour(hour);

    const newOptions = new Set<number>();
    newOptions.add(hour);

    while (newOptions.size < 3) {
      const wrongHour = Math.floor(Math.random() * 12) + 1;
      newOptions.add(wrongHour);
    }

    const shuffled = Array.from(newOptions).sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setDragState('idle');
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleDragStart = () => {
    playSound('pick');
    setDragState('dragging');
  };

  const handleDragEnd = (event: any, info: any, opt: number) => {
    if (!dropZoneRef.current) {
      setDragState('idle');
      return;
    }

    const dropRect = dropZoneRef.current.getBoundingClientRect();
    const { x, y } = info.point; // Using pointer coords

    const isOverlapping = 
      x >= dropRect.left && x <= dropRect.right &&
      y >= dropRect.top && y <= dropRect.bottom;

    if (isOverlapping) {
      if (opt === targetHour) {
        // Correct
        playSound('correct');
        setDragState('success');
        const newScore = score + 1;
        setScore(newScore);

        if (newScore >= MAX_SCORE) {
          setTimeout(() => {
            setIsCompleted(true);
            playSound('fanfare');
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          }, 1000);
        } else {
          setTimeout(() => setupRound(), 1000);
        }
      } else {
        // Wrong
        playSound('wrong');
        setDragState('idle');
      }
    } else {
      setDragState('idle');
    }
  };

  // Allow clicking as an alternative to dragging for mobile accessibility
  const handleClick = (opt: number) => {
    if (dragState !== 'idle') return;
    
    if (opt === targetHour) {
      playSound('correct');
      setDragState('success');
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(() => setupRound(), 1000);
      }
    } else {
      playSound('wrong');
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-[#fff3e0] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="mb-2 flex w-full justify-center md:justify-end z-10">
        {onComplete && allowSkip !== false && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#e65100] font-bold bg-[#e65100]/10 hover:bg-[#e65100]/20" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-[#e65100] md:justify-start md:px-4 md:text-xl">
        Score: {score} / {MAX_SCORE}
      </div>

      <h1 className="text-[#e65100] text-2xl md:text-3xl font-black mb-8 tracking-wide font-['Comic_Sans_MS']">
        Drag or tap the matching clock!
      </h1>
      
      {/* Drop Zone */}
      <div 
        ref={dropZoneRef}
        className={`w-full max-w-xs h-32 md:w-64 md:h-40 border-4 border-dashed rounded-[20px] flex items-center justify-center text-4xl md:text-5xl font-bold transition-colors mb-12 shadow-inner
          ${dragState === 'dragging' ? 'bg-[#fff9c4] border-[#ffb74d] scale-105' : ''}
          ${dragState === 'success' ? 'bg-[#c8e6c9] border-[#4caf50] text-[#2e7d32]' : 'bg-[#fff9c4] border-[#ffb74d] text-[#e65100]'}`
        }
      >
        {dragState === 'success' ? '⭐' : `${targetHour}:00`}
      </div>

      {/* Clocks Container */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full max-w-[600px] min-h-[220px] md:h-32 relative z-10">
        <AnimatePresence mode="popLayout">
          {dragState !== 'success' && options.map((opt, index) => (
            <motion.div
              key={index + '-' + opt}
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.1 }}
              drag
              dragSnapToOrigin
              dragElastic={0.2}
              onDragStart={handleDragStart}
              onDragEnd={(e, info) => handleDragEnd(e, info, opt)}
              onClick={() => handleClick(opt)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer touch-none hover:z-50 active:z-50"
            >
              <MiniClock hour={opt} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#fff3e0]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🎉
            </motion.div>
            <h1 className="text-[#4caf50] text-4xl md:text-5xl font-extrabold mb-4">YOU WIN!</h1>
            
            <div className="flex gap-4 mt-8">
              {allowSkip === false && onComplete && (
                <Button size="lg" variant="jungle" onClick={onComplete} className="text-xl px-8 h-16 rounded-full shadow-lg">
                  Next Game <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
              <Button size="lg" onClick={resetGame} className="bg-[#ff9800] hover:bg-[#e65100] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#e65100] hover:shadow-[0_2px_0_#e65100] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

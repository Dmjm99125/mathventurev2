import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// SVG Clock Component mimicking the main clock
const MainClock = ({ hour }: { hour: number }) => {
  const hourAngle = (hour % 12) * 30; 
  
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg mb-8">
      <circle cx="100" cy="100" r="90" fill="white" stroke="#ff9800" strokeWidth="12" />
      
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
        const angle = (num * Math.PI) / 6 - Math.PI / 2;
        const x = 100 + Math.cos(angle) * 70;
        const y = 100 + Math.sin(angle) * 70;
        return (
          <text 
            key={num}
            x={x} 
            y={y} 
            fill="#00838f" 
            fontSize="20" 
            fontWeight="bold" 
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            textAnchor="middle" 
            alignmentBaseline="central"
          >
            {num}
          </text>
        );
      })}
      
      <line x1="100" y1="100" x2="100" y2="35" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      
      <motion.line 
        x1="100" y1="100" 
        x2="100" y2="55" 
        stroke="#d32f2f" 
        strokeWidth="7" 
        strokeLinecap="round" 
        initial={{ rotate: hourAngle }}
        animate={{ rotate: hourAngle }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        style={{ originX: "100px", originY: "100px" }}
      />
      
      <circle cx="100" cy="100" r="6" fill="#333" />
    </svg>
  );
};

interface FillMissingTimeProps {
  onComplete?: () => void;
}

export function FillMissingTime({ onComplete }: FillMissingTimeProps) {
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
    const { x, y } = info.point; 

    const isOverlapping = 
      x >= dropRect.left && x <= dropRect.right &&
      y >= dropRect.top && y <= dropRect.bottom;

    if (isOverlapping) {
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
        setDragState('idle');
      }
    } else {
      setDragState('idle');
    }
  };

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
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-[#e8f5e9] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="mb-2 flex w-full justify-center md:justify-end z-10">
        {onComplete && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#2e7d32] font-bold bg-[#2e7d32]/10 hover:bg-[#2e7d32]/20" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-[#2e7d32] md:justify-start md:px-4 md:text-xl">
        Score: {score} / {MAX_SCORE}
      </div>

      <h1 className="text-[#2e7d32] text-2xl md:text-4xl font-black mb-8 tracking-wide font-['Comic_Sans_MS']">
        Fill in the missing time!
      </h1>
      
      {/* Clock */}
      <MainClock hour={targetHour} />

      {/* Sentence & Drop Zone */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-2xl md:text-5xl font-bold text-[#37474f] mb-10 bg-white px-4 md:px-8 py-4 rounded-[2rem] shadow-sm font-['Comic_Sans_MS']">
        It is
        <div 
          ref={dropZoneRef}
          className={`w-20 h-20 md:w-24 md:h-24 border-4 border-dashed rounded-[1rem] flex items-center justify-center text-3xl md:text-4xl font-bold transition-colors mx-1 md:mx-4 shadow-inner
            ${dragState === 'dragging' ? 'bg-[#fff59d] border-[#fbc02d] scale-105' : ''}
            ${dragState === 'success' ? 'bg-[#c8e6c9] border-[#4caf50] text-[#1565c0]' : 'bg-[#e3f2fd] border-[#90caf9] text-[#bbdefb]'}`
          }
        >
          {dragState === 'success' ? targetHour : '?'}
        </div>
        : 00
      </div>

      {/* Number Tiles */}
      <div className="flex justify-center gap-6 w-full max-w-[600px] relative z-10">
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
              className="w-20 h-20 bg-[#29b6f6] border-4 border-[#0288d1] rounded-[1rem] flex items-center justify-center text-white text-4xl font-bold shadow-md cursor-pointer touch-none hover:z-50 active:z-50 font-['Comic_Sans_MS']"
            >
              {opt}
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
            className="absolute inset-0 bg-[#e8f5e9]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🎉
            </motion.div>
            <h1 className="text-[#2e7d32] text-4xl md:text-5xl font-extrabold mb-4">YOU WIN!</h1>
            
            <div className="flex gap-4 mt-8">
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare' | 'tick' | 'alarm') => {
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
  } else if (type === 'tick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.05);
  } else if (type === 'alarm') {
    for(let i=0; i<3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now + i*0.15);
      osc.frequency.setValueAtTime(600, now + i*0.15 + 0.075);
      gain.gain.setValueAtTime(0.1, now + i*0.15);
      gain.gain.linearRampToValueAtTime(0.01, now + i*0.15 + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i*0.15); osc.stop(now + i*0.15 + 0.15);
    }
  }
};

const ROUTINES = [
  { emoji: '🥞', text: 'Time for Breakfast!', hour: 8 },
  { emoji: '📚', text: 'Story Time!', hour: 10 },
  { emoji: '🥪', text: 'Lunch Time!', hour: 12 },
  { emoji: '🧸', text: 'Play Time!', hour: 3 },
  { emoji: '🧹', text: 'Clean Up Time!', hour: 4 },
  { emoji: '🌙', text: 'Bed Time!', hour: 8 }
];

// Main Clock component
const InteractiveClock = ({ hour, isShaking }: { hour: number, isShaking: boolean }) => {
  const hourAngle = (hour % 12) * 30; 
  
  return (
    <motion.svg 
      width="220" 
      height="220" 
      viewBox="0 0 220 220" 
      className="drop-shadow-lg mb-8"
      animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <circle cx="110" cy="110" r="100" fill="white" stroke="#ab47bc" strokeWidth="12" />
      
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
        const angle = (num * Math.PI) / 6 - Math.PI / 2;
        const x = 110 + Math.cos(angle) * 75;
        const y = 110 + Math.sin(angle) * 75;
        return (
          <text 
            key={num}
            x={x} 
            y={y} 
            fill="#6a1b9a" 
            fontSize="22" 
            fontWeight="bold" 
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            textAnchor="middle" 
            alignmentBaseline="central"
          >
            {num}
          </text>
        );
      })}
      
      {/* Minute Hand */}
      <line x1="110" y1="110" x2="110" y2="35" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      
      {/* Hour Hand */}
      <motion.line 
        x1="110" y1="110" 
        x2="110" y2="55" 
        stroke="#d32f2f" 
        strokeWidth="8" 
        strokeLinecap="round" 
        initial={{ rotate: hourAngle }}
        animate={{ rotate: hourAngle }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        style={{ originX: "110px", originY: "110px" }}
      />
      
      {/* Center Pin */}
      <circle cx="110" cy="110" r="8" fill="#333" />
    </motion.svg>
  );
};

interface DailyRoutineTimeProps {
  onComplete?: () => void;
}

export function DailyRoutineTime({ onComplete }: DailyRoutineTimeProps) {
  const MAX_SCORE = 10;
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [currentRoutine, setCurrentRoutine] = useState(ROUTINES[0]);
  const [clockHour, setClockHour] = useState(12);
  const [isShaking, setIsShaking] = useState(false);
  const [canClick, setCanClick] = useState(true);

  const setupRound = () => {
    const randomRoutine = ROUTINES[Math.floor(Math.random() * ROUTINES.length)];
    setCurrentRoutine(randomRoutine);
    setClockHour(12);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleAddHour = () => {
    if (!canClick) return;
    playSound('tick');
    setClockHour(prev => (prev % 12) + 1);
  };

  const handleSetAlarm = () => {
    if (!canClick) return;
    setCanClick(false);

    if (clockHour === currentRoutine.hour) {
      playSound('alarm');
      setTimeout(() => playSound('correct'), 500);
      
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1200);
      } else {
        setTimeout(() => setupRound(), 1200);
      }
    } else {
      playSound('wrong');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setCanClick(true);
      }, 500);
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-[#ede7f6] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="mb-2 flex w-full justify-center md:justify-end z-10">
        {onComplete && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#4527a0] font-bold bg-[#4527a0]/10 hover:bg-[#4527a0]/20" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-[#4527a0] md:justify-start md:px-4 md:text-xl">
        Score: {score} / {MAX_SCORE}
      </div>

      <h1 className="text-[#4527a0] text-2xl md:text-4xl font-black mb-6 tracking-wide font-['Comic_Sans_MS']">
        Daily Routine Time!
      </h1>
      
      {/* Routine Box */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentRoutine.text}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white border-4 border-[#7e57c2] rounded-[1rem] px-4 md:px-8 py-4 mb-8 flex flex-col items-center shadow-md"
        >
          <div className="text-6xl mb-2">{currentRoutine.emoji}</div>
          <div className="text-xl md:text-2xl font-bold text-[#4527a0] font-['Comic_Sans_MS'] mb-2 text-center">
            {currentRoutine.text}
          </div>
          <div className="bg-[#ffcdd2] text-[#d32f2f] text-2xl md:text-3xl font-bold px-6 py-2 rounded-xl">
            {currentRoutine.hour}:00
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Clock */}
      <InteractiveClock hour={clockHour} isShaking={isShaking} />

      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row">
        <motion.button 
          whileHover={canClick ? { scale: 1.05, filter: 'brightness(1.1)' } : {}}
          whileTap={canClick ? { scale: 0.95 } : {}}
          onClick={handleAddHour}
          className="bg-[#29b6f6] border-4 border-[#0288d1] text-white font-bold text-2xl md:text-3xl px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-md font-['Comic_Sans_MS']"
        >
          +1 Hour
        </motion.button>
        
        <motion.button 
          whileHover={canClick ? { scale: 1.05, filter: 'brightness(1.1)' } : {}}
          whileTap={canClick ? { scale: 0.95 } : {}}
          onClick={handleSetAlarm}
          className="bg-[#66bb6a] border-4 border-[#388e3c] text-white font-bold text-2xl md:text-3xl px-6 md:px-8 py-3 md:py-4 rounded-2xl shadow-md font-['Comic_Sans_MS']"
        >
          Set Alarm!
        </motion.button>
      </div>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#ede7f6]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🎉
            </motion.div>
            <h1 className="text-[#6a1b9a] text-4xl md:text-5xl font-extrabold mb-4">PERFECT DAY!</h1>
            
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

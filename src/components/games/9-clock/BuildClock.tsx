import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare' | 'pick') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'correct') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
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

const COLORS = ['#e91e63', '#9c27b0', '#3f51b5', '#00bcd4', '#4caf50', '#ff9800'];
const CLOCK_NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);
const MAX_SCORE = CLOCK_NUMBERS.length;

interface BuildClockProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function BuildClock({ onComplete, allowSkip = true }: BuildClockProps) {
  const [placedNumbers, setPlacedNumbers] = useState<Record<number, number>>({});
  const [attempts, setAttempts] = useState(0);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [draggedNumber, setDraggedNumber] = useState<number | null>(null);

  const slotRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const completionRevealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionCallbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCompletionTimers = () => {
    if (completionRevealTimeout.current) {
      clearTimeout(completionRevealTimeout.current);
      completionRevealTimeout.current = null;
    }
    if (completionCallbackTimeout.current) {
      clearTimeout(completionCallbackTimeout.current);
      completionCallbackTimeout.current = null;
    }
  };

  const initGame = () => {
    clearCompletionTimers();
    setPlacedNumbers({});
    setAttempts(0);
    setIsCompleted(false);
    
    // Shuffle 1-12
    const nums = [...CLOCK_NUMBERS];
    nums.sort(() => Math.random() - 0.5);
    setAvailableNumbers(nums);
  };

  useEffect(() => {
    initGame();
    return clearCompletionTimers;
  }, []);

  const handleDragStart = (num: number) => {
    playSound('pick');
    setDraggedNumber(num);
  };

  const findDropSlot = (x: number, y: number) => {
    return CLOCK_NUMBERS.find((slot) => {
      if (placedNumbers[slot] !== undefined) return false;

      const element = slotRefs.current[slot];
      if (!element) return false;

      const dropRect = element.getBoundingClientRect();
      return (
        x >= dropRect.left - 20 && x <= dropRect.right + 20 &&
        y >= dropRect.top - 20 && y <= dropRect.bottom + 20
      );
    }) ?? null;
  };

  const handleDragEnd = (event: any, info: any, num: number) => {
    const { x, y } = info.point; // Uses pointer coords from Framer Motion
    setAttempts(prev => prev + 1);
    const targetSlot = allowSkip === false
      ? findDropSlot(x, y)
      : slotRefs.current[num]
        ? findDropSlotForSource(num, x, y)
        : null;

    if (targetSlot !== null) {
      placeNumber(num, targetSlot);
    } else if (allowSkip === false) {
      const fallbackSlot = CLOCK_NUMBERS.find((slot) => placedNumbers[slot] === undefined);
      if (fallbackSlot !== undefined) {
        placeNumber(num, fallbackSlot);
      }
    } else {
      playSound('wrong');
    }
    
    setDraggedNumber(null);
  };

  const findDropSlotForSource = (num: number, x: number, y: number) => {
    const targetSlot = slotRefs.current[num];
    if (!targetSlot) return null;

    const dropRect = targetSlot.getBoundingClientRect();
    return (
      x >= dropRect.left - 20 && x <= dropRect.right + 20 &&
      y >= dropRect.top - 20 && y <= dropRect.bottom + 20
    ) ? num : null;
  };

  const placeNumber = (num: number, slot: number) => {
    const isCorrect = num === slot;
    playSound(isCorrect ? 'correct' : 'wrong');
    const newPlaced = { ...placedNumbers, [slot]: num };
    const newScore = Object.entries(newPlaced)
      .filter(([placedSlot, number]) => Number(placedSlot) === number)
      .length;
    setPlacedNumbers(newPlaced);
    setAvailableNumbers(prev => prev.filter(n => n !== num));

    if (Object.keys(newPlaced).length === MAX_SCORE) {
      completionRevealTimeout.current = setTimeout(() => {
        setIsCompleted(true);
        playSound('fanfare');
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        
        // Auto-complete after showing celebration
        if (onComplete && allowSkip !== false) {
          completionCallbackTimeout.current = setTimeout(() => onComplete?.(newScore, MAX_SCORE), 4000);
        }
      }, 500);
    }
  };

  const score = Object.entries(placedNumbers)
    .filter(([slot, number]) => Number(slot) === number)
    .length;

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-[#e0f7fa] rounded-[3rem] shadow-sm min-h-[700px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="mb-2 flex w-full justify-center md:justify-end z-10">
        {onComplete && allowSkip !== false && (
        <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#00838f] font-bold bg-[#00838f]/10 hover:bg-[#00838f]/20" onClick={() => onComplete?.()}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-[#00838f] md:justify-start md:px-4 md:text-xl">
        Progress: {Object.keys(placedNumbers).length} / {MAX_SCORE}
      </div>

      <h1 className="text-[#00838f] text-2xl md:text-4xl font-black mb-8 tracking-wide font-['Comic_Sans_MS']">
        {isCompleted ? "You Built the Clock!" : "Build the Clock!"}
      </h1>
      
      {/* The Giant Blank Clock */}
      <div className="w-[300px] h-[300px] md:w-[360px] md:h-[360px] border-[12px] border-[#ffb300] rounded-full bg-white relative shadow-lg mb-10 flex items-center justify-center">
        
        {/* The Slots */}
        {CLOCK_NUMBERS.map(num => {
          const radius = 130; // Distance from center
          const angle = (num * 30 - 90) * (Math.PI / 180);
          
          // Calculate percentages so it scales properly
          const xPercent = 50 + (radius / 150) * 50 * Math.cos(angle);
          const yPercent = 50 + (radius / 150) * 50 * Math.sin(angle);
          
          const isPlaced = placedNumbers[num] !== undefined;

          return (
            <div 
              key={`slot-${num}`}
              ref={(el) => {
                slotRefs.current[num] = el;
              }}
              className={`absolute w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold transition-all duration-300 font-['Comic_Sans_MS'] transform -translate-x-1/2 -translate-y-1/2
                ${isPlaced ? 'border-4 border-[#4caf50] bg-[#c8e6c9] text-[#2e7d32] shadow-sm' : 'border-4 border-dashed border-[#b2ebf2] text-[#b2ebf2]'}`}
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`
              }}
            >
              {isPlaced ? placedNumbers[num] : ''}
            </div>
          );
        })}

        {/* The Magical Spinning Hands (Visible on win) */}
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-10 flex justify-center items-center pointer-events-none"
          >
            <div className="w-4 h-4 bg-[#333] rounded-full absolute z-20" />
            
            <motion.div 
              className="absolute w-[8px] h-[90px] bg-[#d32f2f] rounded-full origin-bottom"
              style={{ bottom: '50%' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute w-[5px] h-[120px] bg-[#333] rounded-full origin-bottom"
              style={{ bottom: '50%' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </div>

      {/* Tiles Area */}
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-[500px] min-h-[140px] z-20">
        <AnimatePresence mode="popLayout">
          {!isCompleted && availableNumbers.map((num, idx) => (
            <motion.div
              key={num}
              initial={{ scale: 0, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              drag
              dragSnapToOrigin
              dragElastic={0.2}
              onDragStart={() => handleDragStart(num)}
              onDragEnd={(e, info) => handleDragEnd(e, info, num)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-[#0288d1] flex items-center justify-center text-white text-2xl font-bold shadow-md cursor-pointer touch-none hover:z-50 active:z-50 font-['Comic_Sans_MS']
                ${draggedNumber === num ? 'opacity-50' : 'opacity-100'}
              `}
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            >
              {num}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isCompleted && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {allowSkip === false && onComplete && (
          <Button size="lg" variant="jungle" onClick={() => onComplete?.(score, MAX_SCORE)} className="text-xl px-8 h-16 rounded-full shadow-lg">
              Next Game <ChevronRight className="ml-2 h-6 w-6" />
            </Button>
          )}
          {allowSkip !== false && (
            <Button size="lg" onClick={initGame} className="bg-[#ff9800] hover:bg-[#f57c00] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#ef6c00] hover:shadow-[0_2px_0_#ef6c00] hover:translate-y-1 transition-all">
              Build it again! 🔄
            </Button>
          )}
        </motion.div>
      )}

    </div>
  );
}

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

interface BuildClockProps {
  onComplete?: () => void;
}

export function BuildClock({ onComplete }: BuildClockProps) {
  const [placedNumbers, setPlacedNumbers] = useState<number[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [draggedNumber, setDraggedNumber] = useState<number | null>(null);

  const slotRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const initGame = () => {
    setPlacedNumbers([]);
    setIsCompleted(false);
    
    // Shuffle 1-12
    const nums = Array.from({ length: 12 }, (_, i) => i + 1);
    nums.sort(() => Math.random() - 0.5);
    setAvailableNumbers(nums);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleDragStart = (num: number) => {
    playSound('pick');
    setDraggedNumber(num);
  };

  const handleDragEnd = (event: any, info: any, num: number) => {
    const targetSlot = slotRefs.current[num];
    if (!targetSlot) {
      setDraggedNumber(null);
      return;
    }

    const dropRect = targetSlot.getBoundingClientRect();
    const { x, y } = info.point; // Uses pointer coords from Framer Motion

    const isOverlapping = 
      x >= dropRect.left - 20 && x <= dropRect.right + 20 &&
      y >= dropRect.top - 20 && y <= dropRect.bottom + 20;

    if (isOverlapping) {
      placeNumber(num);
    } else {
      playSound('wrong');
    }
    
    setDraggedNumber(null);
  };

  const placeNumber = (num: number) => {
    playSound('correct');
    const newPlaced = [...placedNumbers, num];
    setPlacedNumbers(newPlaced);
    setAvailableNumbers(prev => prev.filter(n => n !== num));

    if (newPlaced.length === 12) {
      setTimeout(() => {
        setIsCompleted(true);
        playSound('fanfare');
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        
        // Auto-complete after showing celebration
        if (onComplete) {
          setTimeout(() => onComplete(), 4000);
        }
      }, 500);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-[#e0f7fa] rounded-[3rem] shadow-sm min-h-[700px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#00838f] font-bold bg-[#00838f]/10 hover:bg-[#00838f]/20" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full flex justify-start text-xl font-bold text-[#00838f] mb-2 px-4 absolute top-6 left-6">
        Progress: {placedNumbers.length} / 12
      </div>

      <h1 className="text-[#00838f] text-3xl md:text-4xl font-black mb-8 tracking-wide font-['Comic_Sans_MS']">
        {isCompleted ? "You Built the Clock!" : "Build the Clock!"}
      </h1>
      
      {/* The Giant Blank Clock */}
      <div className="w-[300px] h-[300px] md:w-[360px] md:h-[360px] border-[12px] border-[#ffb300] rounded-full bg-white relative shadow-lg mb-10 flex items-center justify-center">
        
        {/* The Slots */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const radius = 130; // Distance from center
          const angle = (num * 30 - 90) * (Math.PI / 180);
          
          // Calculate percentages so it scales properly
          const xPercent = 50 + (radius / 150) * 50 * Math.cos(angle);
          const yPercent = 50 + (radius / 150) * 50 * Math.sin(angle);
          
          const isPlaced = placedNumbers.includes(num);

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
              {isPlaced ? num : ''}
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
          <Button size="lg" onClick={initGame} className="bg-[#ff9800] hover:bg-[#f57c00] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#ef6c00] hover:shadow-[0_2px_0_#ef6c00] hover:translate-y-1 transition-all">
            Build it again! 🔄
          </Button>
        </motion.div>
      )}

    </div>
  );
}

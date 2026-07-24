import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight, Star } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare') => {
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
    gain.gain.setValueAtTime(0.2, now);
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
  }
};

interface Paghahambing1Props {
  onComplete?: () => void;
}

const translations: Record<string, string> = {
  'long': 'MAHABA',
  'longer': 'MAS MAHABA',
  'longest': 'PINAKAMAHABA'
};

const barColors = ['bg-[#f39c12]', 'bg-[#e67e22]', 'bg-[#d35400]'];

export function Paghahambing1({ onComplete }: Paghahambing1Props) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [targetType, setTargetType] = useState('long');
  const [bars, setBars] = useState<{ id: string, width: number, color: string }[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [stars, setStars] = useState<{ id: number, x: number, y: number }[]>([]);

  const deckRef = useRef<string[]>([]);

  // Fisher-Yates shuffle for fair randomness
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const setupRound = () => {
    if (deckRef.current.length === 0) {
      deckRef.current = shuffleArray(['long', 'longer', 'longest']);
    }
    const nextTarget = deckRef.current.pop()!;
    setTargetType(nextTarget);
    setFeedback("");
    
    const lengths = [
      { id: 'long', width: 100 },
      { id: 'longer', width: 200 },
      { id: 'longest', width: 300 }
    ];
    
    // Shuffle lengths and assign colors
    const shuffled = shuffleArray(lengths).map((item, index) => ({
      ...item,
      color: barColors[index]
    }));
      
    setBars(shuffled);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const triggerStarBurst = () => {
    const newStars = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400
    }));
    setStars(newStars);
    setTimeout(() => setStars([]), 1000);
  };

  const handleChoice = (id: string) => {
    if (feedback === "Ang galing! ⭐") return; // Prevent multiple clicks

    if (id === targetType) {
      playSound('correct');
      setFeedback("Ang galing! ⭐");
      triggerStarBurst();
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(setupRound, 1200);
      }
    } else {
      playSound('wrong');
      setFeedback("Subukan muli! 💪");
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  if (!targetType) return null;

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#fef9e7] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-auto mb-auto flex flex-col items-center z-10">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#d35400] mb-2 drop-shadow-sm">Paghahambing ng Mahaba, Mas Mahaba, Pinakamahaba</h1>
        
        <div className="w-full flex justify-between px-4 mb-4 text-xl font-bold text-[#2c3e50]">
          <div className="flex items-center gap-1">Puntos: <span className="text-[#d35400]">{score}</span> / {MAX_SCORE}</div>
        </div>

        <div className="bg-white px-8 py-4 rounded-[15px] shadow-[0_4px_8px_rgba(0,0,0,0.1)] text-2xl md:text-3xl font-bold text-[#2e86c1] mb-8 w-[90%] max-w-[500px]">
          I-click ang {translations[targetType]}
        </div>

        {/* Game Area */}
        <div className="flex flex-col gap-6 w-full items-start px-6 bg-white rounded-3xl py-8 shadow-inner border-4 border-[#e5e7eb]">
          {bars.map((bar) => (
            <motion.div
              key={bar.id}
              whileHover={{ scale: 1.02, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChoice(bar.id)}
              className="flex items-center w-full cursor-pointer"
            >
              <div className="text-3xl mr-4">📏</div>
              <motion.div 
                className={`h-[45px] rounded-r-[25px] shadow-[4px_4px_0px_rgba(0,0,0,0.1)] ${bar.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${bar.width}px` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
            </motion.div>
          ))}
        </div>

        <div className={`mt-6 text-2xl md:text-3xl font-bold min-h-[40px] ${feedback === "Ang galing! ⭐" ? "text-[#27ae60]" : "text-[#c0392b]"}`}>
          {feedback}
        </div>

      </div>

      {/* Floating Stars */}
      <AnimatePresence>
        {stars.map(star => (
          <motion.div
            key={star.id}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: 1.5, x: star.x, y: star.y, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 text-5xl pointer-events-none z-50 -ml-6 -mt-6"
          >
            ⭐
          </motion.div>
        ))}
      </AnimatePresence>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#fef9e7]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🎉
            </motion.div>
            <h1 className="text-[#d35400] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">Napakahusay!</h1>
            <p className="text-2xl text-[#2c3e50] font-bold mb-8">Nakuha mo ang {MAX_SCORE} bituin!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#27ae60] hover:bg-[#1e8449] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#1e8449] hover:shadow-[0_2px_0_#1e8449] hover:translate-y-1 transition-all">
                Maglaro Muli 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
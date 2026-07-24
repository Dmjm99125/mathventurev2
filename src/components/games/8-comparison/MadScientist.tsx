import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare' | 'pop') => {
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
  }
};

const monsterPrizes = ['👾', '👽', '👻', '🤖', '🦇', '🦉', '🐸', '🦁'];

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

interface MadScientistProps {
  onComplete?: () => void;
}

export function MadScientist({ onComplete }: MadScientistProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [isLookingForMost, setIsLookingForMost] = useState(true);
  const [heights, setHeights] = useState<number[]>([0, 0, 0]);
  const [shelfItems, setShelfItems] = useState<string[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);

  const colors = ["#ec4899", "#06b6d4", "#f97316"]; // Potion pink, blue, orange

  const setupRound = () => {
    setIsLookingForMost(Math.random() > 0.5);
    const newHeights = shuffleArray([25, 60, 95]);
    setHeights(newHeights);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleTubeClick = (index: number) => {
    if (!canClick) return;
    setCanClick(false);

    const targetHeight = isLookingForMost ? Math.max(...heights) : Math.min(...heights);
    const isCorrect = heights[index] === targetHeight;

    if (isCorrect) {
      playSound('correct');
      const newScore = score + 1;
      setScore(newScore);

      // Add a random prize to the shelf
      const prize = monsterPrizes[Math.floor(Math.random() * monsterPrizes.length)];
      setShelfItems(prev => [...prev, prize]);
      
      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 800);
      } else {
        setTimeout(setupRound, 1000);
      }
    } else {
      playSound('wrong');
      setTimeout(() => setCanClick(true), 800);
    }
  };

  const resetGame = () => {
    setScore(0);
    setShelfItems([]);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-[440px] mt-4 flex flex-col items-center z-10 flex-grow bg-white border-[6px] border-[#a855f7] rounded-[32px] p-6 shadow-[0_20px_40px_rgba(168,85,247,0.2)] relative">
        
        <div className="w-full flex justify-between text-xl font-bold text-[#a855f7] mb-2">
          <div>Mixes Made: <span className="text-[#a855f7]">{score}</span></div>
          <div>Goal: <span className="text-[#f97316]">{MAX_SCORE}</span></div>
        </div>

        <div className="text-3xl md:text-4xl font-black my-4 text-[#6b21a8] uppercase tracking-wide">
          Find the <span className={`px-3 py-1 rounded-2xl border-2 border-dashed ${isLookingForMost ? 'bg-[#fef08a] border-[#ca8a04] text-[#ca8a04]' : 'bg-[#bfdbfe] border-[#2563eb] text-[#2563eb]'}`}>
            {isLookingForMost ? 'MOST' : 'LEAST'}
          </span>
        </div>
        <p className="m-0 font-bold text-[#64748b] text-sm md:text-base">Tap the test tube with the right amount of liquid!</p>

        {/* Lab Table Stage */}
        <div className="h-[200px] w-full bg-[#f8fafc] border-4 border-[#cbd5e1] rounded-3xl my-6 flex justify-around items-end p-3 pb-6 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05),0_8px_0_#e2e8f0] relative">
          
          {heights.map((height, i) => {
            const isCorrect = !canClick && height === (isLookingForMost ? Math.max(...heights) : Math.min(...heights));
            const isWrong = !canClick && !isCorrect;

            return (
              <motion.div
                key={`tube-${i}`}
                className="w-[28%] flex flex-col items-center cursor-pointer relative"
                onClick={() => handleTubeClick(i)}
                whileHover={canClick ? { scale: 1.05 } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
                animate={isCorrect ? { scale: [1, 1.15, 1.1] } : isWrong ? { opacity: 0.3 } : { scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {/* Lip of tube */}
                <div className="w-[58px] h-[8px] bg-[#64748b] rounded-[4px] -mb-[2px] z-10" />
                
                {/* Glass Tube */}
                <div className="w-[50px] h-[120px] border-4 border-t-0 border-[#64748b] rounded-b-[25px] bg-white/60 relative flex flex-col justify-end overflow-hidden shadow-[inset_-5px_0_5px_rgba(255,255,255,0.6)]">
                  <motion.div 
                    className="w-full relative rounded-b-[20px]"
                    style={{ backgroundColor: colors[i] }}
                    initial={{ height: "0%" }}
                    animate={{ 
                      height: `${height}%`,
                      filter: isWrong ? 'grayscale(1)' : 'none'
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    {/* Liquid Sparkles */}
                    {height > 0 && (
                      <motion.div 
                        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: i * 0.3 }}
                        className="absolute top-1 left-[35%] text-[0.8rem] opacity-60"
                      >
                        ✨
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <div className="mt-2 font-bold text-lg text-[#475569]">{['A', 'B', 'C'][i]}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Monster Shelf */}
        <div className="w-full bg-[#f1f5f9] border-t-4 border-[#a855f7] rounded-xl p-3 mt-auto min-h-[80px]">
          <div className="text-xs text-[#94a3b8] font-bold uppercase mb-2">Lab Helper Crew</div>
          <div className="flex justify-center flex-wrap gap-2 text-3xl">
            {shelfItems.map((item, idx) => (
              <motion.span 
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>

      </div>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🧪
            </motion.div>
            <h1 className="text-[#a855f7] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">Genius Chemist!</h1>
            <p className="text-2xl text-[#475569] font-bold mb-8">You've mastered measuring the liquids!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#16a34a] hover:shadow-[0_2px_0_#16a34a] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
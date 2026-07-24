import React, { useState, useEffect, useRef } from 'react';
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

const itemsDatabase = [
  { emoji: '🐜', type: 'short' },
  { emoji: '🐁', type: 'short' },
  { emoji: '🍓', type: 'short' },
  { emoji: '🪙', type: 'short' },
  { emoji: '🐌', type: 'short' },
  { emoji: '🦒', type: 'tall' },
  { emoji: '🏢', type: 'tall' },
  { emoji: '🌲', type: 'tall' },
  { emoji: '🦕', type: 'tall' },
  { emoji: '🗼', type: 'tall' }
];

interface CatchFallProps {
  onComplete?: () => void;
}

export function CatchFall({ onComplete }: CatchFallProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [currentItem, setCurrentItem] = useState(itemsDatabase[0]);
  const [itemKey, setItemKey] = useState(0); // Used to force re-render/re-animation of the falling item
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong' | 'missed'>('none');
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);

  // We use a ref to track if the current falling item has been interacted with
  const hasInteractedRef = useRef(false);

  const spawnNextItem = () => {
    const nextItem = itemsDatabase[Math.floor(Math.random() * itemsDatabase.length)];
    setCurrentItem(nextItem);
    setItemKey(prev => prev + 1);
    setFeedback('none');
    setCanClick(true);
    hasInteractedRef.current = false;
  };

  useEffect(() => {
    spawnNextItem();
  }, []);

  const handleChoice = (chosenType: 'short' | 'tall') => {
    if (!canClick) return;
    setCanClick(false);
    hasInteractedRef.current = true;

    if (currentItem.type === chosenType) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 800);
      } else {
        setTimeout(spawnNextItem, 800);
      }
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(spawnNextItem, 800);
    }
  };

  const handleAnimationComplete = () => {
    // If the animation finishes and the user hasn't clicked, it means they missed it
    if (!hasInteractedRef.current && canClick) {
      setCanClick(false);
      hasInteractedRef.current = true;
      playSound('wrong');
      setFeedback('missed');
      setTimeout(spawnNextItem, 800);
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    spawnNextItem();
  };

  // Calculate fall duration based on score (gets faster as score increases)
  const fallDuration = Math.max(1.5, 4.0 - (score * 0.25));

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#282c34] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-[#ffca28] relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-white font-bold bg-white/20 hover:bg-white/40" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full flex justify-between text-xl font-bold text-[#ffca28] mb-4">
        <div>Score: <span className="text-white">{score}</span></div>
        <div>Goal: <span className="text-white">{MAX_SCORE}</span></div>
      </div>

      <h1 className="text-[#ffca28] text-3xl font-black mb-2 tracking-wide">🌠 Catch & Measure! 🌠</h1>
      <p className="m-0 font-bold text-white/80 text-sm md:text-base mb-4">Tap the correct bin before it hits the floor!</p>

      {/* Game Area */}
      <div className="w-full max-w-[500px] h-[350px] relative bg-gradient-to-b from-[#87ceeb] to-[#e0f7fa] rounded-[24px] overflow-hidden border-[6px] border-white shadow-inner mb-6">
        
        {/* Feedback Display */}
        <AnimatePresence>
          {feedback !== 'none' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`absolute top-[20%] left-0 w-full text-center text-4xl font-black drop-shadow-md z-20 ${
                feedback === 'correct' ? 'text-[#4caf50]' : 'text-[#f44336]'
              }`}
            >
              {feedback === 'correct' ? '⭐ Catch!' : feedback === 'missed' ? 'Missed!' : 'Oops!'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Falling Item */}
        <AnimatePresence mode="popLayout">
          {feedback === 'none' && (
            <motion.div
              key={itemKey}
              initial={{ y: -60, x: '-50%' }}
              animate={{ y: 350, x: '-50%' }}
              transition={{ duration: fallDuration, ease: "linear" }}
              onAnimationComplete={handleAnimationComplete}
              className="absolute left-1/2 text-[4rem] leading-none z-10"
            >
              {currentItem.emoji}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bins */}
      <div className="w-full max-w-[500px] flex justify-between gap-4 px-2">
        <motion.button
          whileHover={canClick ? { scale: 1.05 } : {}}
          whileTap={canClick ? { scale: 0.95 } : {}}
          onClick={() => handleChoice('short')}
          className="flex-1 bg-[#4caf50] text-white border-[5px] border-white rounded-2xl h-[100px] text-2xl font-black flex flex-col justify-center items-center shadow-[0_6px_0_#2e7d32] active:shadow-none active:translate-y-[6px]"
        >
          🐜 SHORT
        </motion.button>
        <motion.button
          whileHover={canClick ? { scale: 1.05 } : {}}
          whileTap={canClick ? { scale: 0.95 } : {}}
          onClick={() => handleChoice('tall')}
          className="flex-1 bg-[#f44336] text-white border-[5px] border-white rounded-2xl h-[100px] text-2xl font-black flex flex-col justify-center items-center shadow-[0_6px_0_#c62828] active:shadow-none active:translate-y-[6px]"
        >
          🦒 TALL
        </motion.button>
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
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🏆
            </motion.div>
            <h1 className="text-[#ffca28] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">Super Catcher!</h1>
            <p className="text-2xl text-[#282c34] font-bold mb-8">You successfully sorted all the items!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#4caf50] hover:bg-[#388e3c] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#388e3c] hover:shadow-[0_2px_0_#388e3c] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
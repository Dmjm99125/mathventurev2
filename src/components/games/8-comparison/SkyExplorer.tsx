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

const timePairs = [
  {day: {emoji: '☀️', name: 'Bright Sun'}, night: {emoji: '🌙', name: 'Glowing Moon'}},
  {day: {emoji: '🏫', name: 'Go to School'}, night: {emoji: '🛌', name: 'Sleep in Bed'}},
  {day: {emoji: '🍳', name: 'Eat Breakfast'}, night: {emoji: '🦉', name: 'Hooting Owl'}},
  {day: {emoji: '🪁', name: 'Fly a Kite'}, night: {emoji: '✨', name: 'Shining Stars'}},
  {day: {emoji: '🐓', name: 'Rooster Crows'}, night: {emoji: '🦇', name: 'Flying Bat'}},
  {day: {emoji: '⚽', name: 'Play Outside'}, night: {emoji: '💤', name: 'Dreaming'}}
];

const spacePrizes = ['🪐', '🚀', '⭐', '🛸', '🛰️', '☄️', '🌍', '👽'];

interface SkyExplorerProps {
  onComplete?: () => void;
}

export function SkyExplorer({ onComplete }: SkyExplorerProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [isLookingForDay, setIsLookingForDay] = useState(true);
  const [currentPair, setCurrentPair] = useState(timePairs[0]);
  const [isLeftDay, setIsLeftDay] = useState(true);
  const [shelfItems, setShelfItems] = useState<string[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);

  const setupRound = () => {
    setIsLookingForDay(Math.random() > 0.5);
    setCurrentPair(timePairs[Math.floor(Math.random() * timePairs.length)]);
    setIsLeftDay(Math.random() > 0.5);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleCardClick = (isDay: boolean) => {
    if (!canClick) return;
    setCanClick(false);

    const isCorrect = isDay === isLookingForDay;

    if (isCorrect) {
      playSound('correct');
      const newScore = score + 1;
      setScore(newScore);

      // Add a random prize to the shelf
      const prize = spacePrizes[Math.floor(Math.random() * spacePrizes.length)];
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
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-[440px] mt-4 flex flex-col items-center z-10 flex-grow bg-white border-[6px] border-[#0ea5e9] rounded-[32px] p-6 shadow-[0_20px_40px_rgba(14,165,233,0.2)] relative">
        
        <div className="w-full flex justify-between text-xl font-bold text-[#0ea5e9] mb-2">
          <div>Sky Explored: <span className="text-[#0ea5e9]">{score}</span></div>
          <div>Goal: <span className="text-[#f97316]">{MAX_SCORE}</span></div>
        </div>

        <div className="text-3xl md:text-4xl font-black my-4 text-[#0369a1] uppercase">
          Done at <span className={`px-3 py-1 rounded-2xl border-2 border-dashed ${isLookingForDay ? 'bg-[#fef08a] border-[#ca8a04] text-[#ca8a04]' : 'bg-[#e0e7ff] border-[#4338ca] text-[#4338ca]'}`}>
            {isLookingForDay ? 'DAYTIME ☀️' : 'NIGHTTIME 🌙'}
          </span>?
        </div>
        <p className="m-0 font-bold text-[#64748b] text-sm md:text-base">Tap the picture that belongs to the time!</p>

        {/* Telescope View Bench */}
        <div className="h-[180px] w-full bg-[#f8fafc] border-4 border-[#cbd5e1] rounded-3xl my-6 flex justify-around items-center p-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] relative">
          <AnimatePresence mode="popLayout">
            {/* Left Card */}
            <motion.div
              key={`left-${currentPair.day.name}-${score}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-[44%] h-[140px] bg-white border-4 border-[#e2e8f0] rounded-[20px] flex flex-col justify-center items-center cursor-pointer shadow-[0_6px_0_#cbd5e1] hover:shadow-[0_2px_0_#cbd5e1] hover:translate-y-1 transition-all"
              onClick={() => handleCardClick(isLeftDay)}
            >
              <div className="text-[3.8rem] mb-1 leading-none">{isLeftDay ? currentPair.day.emoji : currentPair.night.emoji}</div>
              <div className="font-bold text-[#475569] text-sm md:text-base leading-tight">{isLeftDay ? currentPair.day.name : currentPair.night.name}</div>
            </motion.div>

            {/* Right Card */}
            <motion.div
              key={`right-${currentPair.day.name}-${score}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-[44%] h-[140px] bg-white border-4 border-[#e2e8f0] rounded-[20px] flex flex-col justify-center items-center cursor-pointer shadow-[0_6px_0_#cbd5e1] hover:shadow-[0_2px_0_#cbd5e1] hover:translate-y-1 transition-all"
              onClick={() => handleCardClick(!isLeftDay)}
            >
              <div className="text-[3.8rem] mb-1 leading-none">{!isLeftDay ? currentPair.day.emoji : currentPair.night.emoji}</div>
              <div className="font-bold text-[#475569] text-sm md:text-base leading-tight">{!isLeftDay ? currentPair.day.name : currentPair.night.name}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Badge Rack */}
        <div className="w-full bg-[#f1f5f9] border-t-4 border-[#0ea5e9] rounded-xl p-3 mt-auto min-h-[80px]">
          <div className="text-xs text-[#94a3b8] font-bold uppercase mb-2">Cosmic Exploration Case</div>
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
              🚀
            </motion.div>
            <h1 className="text-[#0ea5e9] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">Star Explorer!</h1>
            <p className="text-2xl text-[#475569] font-bold mb-8">You've mastered daytime and nighttime!</p>
            
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
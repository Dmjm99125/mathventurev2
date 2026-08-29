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

const farmPairs = [
  {heavy: {emoji: '🐄', name: 'Cow'}, light: {emoji: '🍓', name: 'Berry'}},
  {heavy: {emoji: '🚜', name: 'Tractor'}, light: {emoji: '🪶', name: 'Feather'}},
  {heavy: {emoji: '🐷', name: 'Pig'}, light: {emoji: '🪱', name: 'Worm'}},
  {heavy: {emoji: '🎃', name: 'Pumpkin'}, light: {emoji: '🍃', name: 'Leaf'}},
  {heavy: {emoji: '🪵', name: 'Log'}, light: {emoji: '🌸', name: 'Flower'}},
  {heavy: {emoji: '🐴', name: 'Horse'}, light: {emoji: '🐣', name: 'Chick'}},
  {heavy: {emoji: '🍉', name: 'Melon'}, light: {emoji: '🍒', name: 'Cherry'}},
  {heavy: {emoji: '🏠', name: 'Barn'}, light: {emoji: '🎈', name: 'Balloon'}}
];

const farmPrizes = ['🌻', '🍎', '🌽', '🥚', '🥕', '🍯', '🥛', '🍉'];

interface BarnyardBalanceProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function BarnyardBalance({ onComplete, allowSkip = true }: BarnyardBalanceProps) {
  const MAX_SCORE = 10;
  const canReplay = allowSkip !== false;
  
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isLookingForHeavy, setIsLookingForHeavy] = useState(true);
  const [currentPair, setCurrentPair] = useState(farmPairs[0]);
  const [isLeftHeavy, setIsLeftHeavy] = useState(true);
  const [shelfItems, setShelfItems] = useState<string[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);
  const [answeredItems, setAnsweredItems] = useState(0);

  const setupRound = () => {
    setIsLookingForHeavy(Math.random() > 0.5);
    setCurrentPair(farmPairs[Math.floor(Math.random() * farmPairs.length)]);
    setIsLeftHeavy(Math.random() > 0.5);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const advanceAssignedRound = (newAnsweredItems: number) => {
    if (allowSkip !== false) return false;

    setTimeout(() => {
      if (newAnsweredItems >= MAX_SCORE) {
        setIsCompleted(true);
        playSound('fanfare');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        setupRound();
      }
    }, 800);
    return true;
  };

  const handleCardClick = (isHeavy: boolean) => {
    if (!canClick) return;
    const newAttempts = attempts + 1;
    const newAnsweredItems = answeredItems + 1;
    setAttempts(prev => prev + 1);
    setAnsweredItems(newAnsweredItems);
    setCanClick(false);

    const isCorrect = isHeavy === isLookingForHeavy;

    if (isCorrect) {
      playSound('correct');
      const newScore = score + 1;
      setScore(newScore);

      // Add a random prize to the shelf every time they get it right
      const prize = farmPrizes[Math.floor(Math.random() * farmPrizes.length)];
      setShelfItems(prev => [...prev, prize]);

      if (advanceAssignedRound(newAnsweredItems)) return;
      
      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          if (allowSkip !== false) onComplete?.(newScore, newAttempts);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 800);
      } else {
        setTimeout(setupRound, 1000);
      }
    } else {
      if (advanceAssignedRound(newAnsweredItems)) return;
      playSound('wrong');
      setTimeout(() => setCanClick(true), 800);
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setAnsweredItems(0);
    setShelfItems([]);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-b from-[#f0fdf4] to-[#dcfce7] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="mb-4 flex w-full justify-center md:justify-end z-10">
        {onComplete && allowSkip !== false && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={() => onComplete?.()}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-[440px] mt-4 flex flex-col items-center z-10 flex-grow bg-white border-[6px] border-[#ef4444] rounded-[32px] p-6 shadow-[0_20px_40px_rgba(239,68,68,0.15)] relative">
        
        <div className="w-full flex justify-between text-xl font-bold text-[#ef4444] mb-2">
          <div>Items Sorted: <span className="text-[#ef4444]">{score}</span></div>
          <div>Goal: <span className="text-[#78350f]">{MAX_SCORE}</span></div>
        </div>

        <div className="text-3xl md:text-4xl font-black my-4 text-[#991b1b] uppercase">
          Which is <span className={`px-3 py-1 rounded-2xl border-2 border-dashed ${isLookingForHeavy ? 'bg-[#ffedd5] border-[#ea580c] text-[#ea580c]' : 'bg-[#e0f2fe] border-[#0284c7] text-[#0284c7]'}`}>
            {isLookingForHeavy ? 'HEAVY' : 'LIGHT'}
          </span>?
        </div>
        <p className="m-0 font-bold text-[#64748b] text-sm md:text-base">Tap the card that matches the word!</p>

        {/* Barnyard Stage */}
        <div className="h-[180px] w-full bg-[#f8fafc] border-4 border-[#cbd5e1] rounded-3xl my-6 flex justify-around items-center p-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] relative">
          <AnimatePresence mode="popLayout">
            {/* Left Card */}
            <motion.div
              key={`left-${currentPair.heavy.name}-${score}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-[42%] h-[140px] bg-white border-4 border-[#e2e8f0] rounded-[20px] flex flex-col justify-center items-center cursor-pointer shadow-[0_6px_0_#cbd5e1] hover:shadow-[0_2px_0_#cbd5e1] hover:translate-y-1 transition-all"
              onClick={() => handleCardClick(isLeftHeavy)}
            >
              <div className="text-[3.8rem] mb-1 leading-none">{isLeftHeavy ? currentPair.heavy.emoji : currentPair.light.emoji}</div>
              <div className="font-bold text-[#475569] uppercase text-sm">{isLeftHeavy ? currentPair.heavy.name : currentPair.light.name}</div>
            </motion.div>

            {/* Right Card */}
            <motion.div
              key={`right-${currentPair.heavy.name}-${score}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-[42%] h-[140px] bg-white border-4 border-[#e2e8f0] rounded-[20px] flex flex-col justify-center items-center cursor-pointer shadow-[0_6px_0_#cbd5e1] hover:shadow-[0_2px_0_#cbd5e1] hover:translate-y-1 transition-all"
              onClick={() => handleCardClick(!isLeftHeavy)}
            >
              <div className="text-[3.8rem] mb-1 leading-none">{!isLeftHeavy ? currentPair.heavy.emoji : currentPair.light.emoji}</div>
              <div className="font-bold text-[#475569] uppercase text-sm">{!isLeftHeavy ? currentPair.heavy.name : currentPair.light.name}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Trophy Shelf */}
        <div className="w-full bg-[#f1f5f9] border-t-4 border-[#ef4444] rounded-xl p-3 mt-auto min-h-[80px]">
          <div className="text-xs text-[#94a3b8] font-bold uppercase mb-2">Harvest Trophy Case</div>
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
              🏆
            </motion.div>
            <h1 className="text-[#ef4444] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">🚜 Master Farmer! 🚜</h1>
            <p className="text-2xl text-[#475569] font-bold mb-8">You've mastered heavy and light on the farm!</p>
            
            <div className="flex gap-4">
              {allowSkip === false && onComplete && (
                <Button size="lg" variant="jungle" onClick={() => onComplete?.(score, MAX_SCORE)} className="text-xl px-8 h-16 rounded-full shadow-lg">
                  Next Game <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
              {canReplay && (
                <Button size="lg" onClick={resetGame} className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#16a34a] hover:shadow-[0_2px_0_#16a34a] hover:translate-y-1 transition-all">
                  Play Again 🔄
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

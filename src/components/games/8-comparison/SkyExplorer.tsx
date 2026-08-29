import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

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
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'fanfare') {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }
};

const timePairs = [
  { day: { emoji: '☀️', name: 'Bright Sun' }, night: { emoji: '🌙', name: 'Glowing Moon' } },
  { day: { emoji: '🏫', name: 'Go to School' }, night: { emoji: '🛌', name: 'Sleep in Bed' } },
  { day: { emoji: '🍳', name: 'Eat Breakfast' }, night: { emoji: '🦉', name: 'Hooting Owl' } },
  { day: { emoji: '🪁', name: 'Fly a Kite' }, night: { emoji: '✨', name: 'Shining Stars' } },
  { day: { emoji: '🐓', name: 'Rooster Crows' }, night: { emoji: '🦇', name: 'Flying Bat' } },
  { day: { emoji: '⚽', name: 'Play Outside' }, night: { emoji: '💤', name: 'Dreaming' } },
];

const spacePrizes = ['🪐', '🚀', '⭐', '🛸', '🛰️', '☄️', '🌍', '👽'];

interface SkyExplorerProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function SkyExplorer({ onComplete, allowSkip = true }: SkyExplorerProps) {
  const MAX_SCORE = 10;
  const canReplay = allowSkip !== false;

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [answeredItems, setAnsweredItems] = useState(0);
  const [isLookingForDay, setIsLookingForDay] = useState(true);
  const [currentPair, setCurrentPair] = useState(timePairs[0]);
  const [isLeftDay, setIsLeftDay] = useState(true);
  const [shelfItems, setShelfItems] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);

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
    }, 1000);
    return true;
  };

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
    if (!canClick) {
      return;
    }

    setCanClick(false);
    const newAttempts = attempts + 1;
    setAttempts(prev => prev + 1);
    const newAnsweredItems = answeredItems + 1;
    setAnsweredItems(newAnsweredItems);
    const isCorrect = isDay === isLookingForDay;

    if (isCorrect) {
      playSound('correct');
      const newScore = score + 1;
      setScore(newScore);

      const prize = spacePrizes[Math.floor(Math.random() * spacePrizes.length)];
      setShelfItems((prev) => [...prev, prize]);

      if (advanceAssignedRound(newAnsweredItems)) {
        return;
      }

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
      if (allowSkip === false) {
        advanceAssignedRound(newAnsweredItems);
      } else {
        setTimeout(() => setCanClick(true), 800);
      }
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
    <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col items-center overflow-hidden rounded-[3rem] border-4 border-white bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd] p-6 font-display text-center shadow-sm select-none">
      <div className="z-10 mb-4 flex w-full flex-wrap justify-center md:justify-end">
        {onComplete && allowSkip !== false && (
          <Button
            variant="ghost"
            className="w-full max-w-sm justify-center md:w-auto bg-white/50 font-bold text-[#2c3e50] hover:bg-white"
            onClick={() => onComplete?.()}
          >
            Skip <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="relative z-10 mt-4 flex w-full max-w-[440px] flex-grow flex-col items-center rounded-[32px] border-[6px] border-[#0ea5e9] bg-white p-4 shadow-[0_20px_40px_rgba(14,165,233,0.2)] md:p-6">
        <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-lg font-bold text-[#0ea5e9] md:justify-between md:text-xl">
          <div>
            Sky Explored: <span className="text-[#0ea5e9]">{score}</span>
          </div>
          <div>
            Goal: <span className="text-[#f97316]">{MAX_SCORE}</span>
          </div>
        </div>

        <div className="my-4 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-black uppercase text-[#0369a1] md:text-4xl">
          <span>Done at</span>
          <span
            className={`w-full max-w-[240px] rounded-2xl border-2 border-dashed px-3 py-1 text-center break-words ${
              isLookingForDay
                ? 'border-[#ca8a04] bg-[#fef08a] text-[#ca8a04]'
                : 'border-[#4338ca] bg-[#e0e7ff] text-[#4338ca]'
            }`}
          >
            {isLookingForDay ? 'DAYTIME ☀️' : 'NIGHTTIME 🌙'}
          </span>
          <span>?</span>
        </div>

        <p className="m-0 text-sm font-bold text-[#64748b] md:text-base">
          Tap the picture that belongs to the time!
        </p>

        <div className="relative my-6 flex h-[180px] w-full items-center justify-around rounded-3xl border-4 border-[#cbd5e1] bg-[#f8fafc] p-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`left-${currentPair.day.name}-${score}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-[140px] w-[44%] cursor-pointer flex-col items-center justify-center rounded-[20px] border-4 border-[#e2e8f0] bg-white shadow-[0_6px_0_#cbd5e1] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#cbd5e1]"
              onClick={() => handleCardClick(isLeftDay)}
            >
              <div className="mb-1 text-[3.8rem] leading-none">
                {isLeftDay ? currentPair.day.emoji : currentPair.night.emoji}
              </div>
              <div className="text-sm font-bold leading-tight text-[#475569] md:text-base">
                {isLeftDay ? currentPair.day.name : currentPair.night.name}
              </div>
            </motion.div>

            <motion.div
              key={`right-${currentPair.day.name}-${score}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="flex h-[140px] w-[44%] cursor-pointer flex-col items-center justify-center rounded-[20px] border-4 border-[#e2e8f0] bg-white shadow-[0_6px_0_#cbd5e1] transition-all hover:translate-y-1 hover:shadow-[0_2px_0_#cbd5e1]"
              onClick={() => handleCardClick(!isLeftDay)}
            >
              <div className="mb-1 text-[3.8rem] leading-none">
                {!isLeftDay ? currentPair.day.emoji : currentPair.night.emoji}
              </div>
              <div className="text-sm font-bold leading-tight text-[#475569] md:text-base">
                {!isLeftDay ? currentPair.day.name : currentPair.night.name}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-auto min-h-[80px] w-full rounded-xl border-t-4 border-[#0ea5e9] bg-[#f1f5f9] p-3">
          <div className="mb-2 text-xs font-bold uppercase text-[#94a3b8]">Cosmic Exploration Case</div>
          <div className="flex flex-wrap justify-center gap-2 text-3xl">
            {shelfItems.map((item, idx) => (
              <motion.span
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center rounded-[3rem] bg-white/95 p-6 text-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mb-4 text-[6rem] leading-none drop-shadow-lg"
            >
              🚀
            </motion.div>
            <h1 className="mb-4 text-4xl font-extrabold text-[#0ea5e9] drop-shadow-sm md:text-5xl">
              Star Explorer!
            </h1>
            <p className="mb-8 text-2xl font-bold text-[#475569]">You've mastered daytime and nighttime!</p>

            <div className="flex gap-4">
              {allowSkip === false && onComplete && (
                <Button size="lg" variant="jungle" onClick={() => onComplete?.(score, MAX_SCORE)} className="text-xl px-8 h-16 rounded-full shadow-lg">
                  Next Game <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
              {canReplay && (
                <Button
                  size="lg"
                  onClick={resetGame}
                  className="h-16 rounded-full bg-[#22c55e] px-10 text-2xl font-bold text-white shadow-[0_4px_0_#16a34a] transition-all hover:translate-y-1 hover:bg-[#16a34a] hover:shadow-[0_2px_0_#16a34a]"
                >
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

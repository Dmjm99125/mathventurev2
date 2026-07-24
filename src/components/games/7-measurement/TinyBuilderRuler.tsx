import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'pop' | 'fanfare') => {
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
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
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

const brickLabels = ['🧱 BLOCK', '📦 BOX', '🪵 LOG', 'BAR ✨', 'BEAM 🛠️', 'BOARD'];
const toolPrizes = ['🔨', '🪚', '🧰', '🧱', '🚜', '📐', '🔧', '🦺'];

interface TinyBuilderRulerProps {
  onComplete?: () => void;
}

export function TinyBuilderRuler({ onComplete }: TinyBuilderRulerProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [correctLength, setCorrectLength] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [toyLabel, setToyLabel] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [guessedIncorrectly, setGuessedIncorrectly] = useState<number[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [earnedTools, setEarnedTools] = useState<string[]>([]);
  
  const setupRound = () => {
    const length = Math.floor(Math.random() * 5) + 1;
    setCorrectLength(length);
    setToyLabel(brickLabels[Math.floor(Math.random() * brickLabels.length)]);
    
    let newChoices = [length];
    while (newChoices.length < 3) {
      const fakeNum = Math.floor(Math.random() * 5) + 1;
      if (!newChoices.includes(fakeNum)) newChoices.push(fakeNum);
    }
    setChoices(newChoices.sort(() => Math.random() - 0.5));
    setGuessedIncorrectly([]);
    setIsRevealed(false);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleChoice = (guess: number) => {
    if (isRevealed || guessedIncorrectly.includes(guess)) return;

    if (guess === correctLength) {
      playSound('correct');
      setIsRevealed(true);
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          const prize = toolPrizes[Math.floor(Math.random() * toolPrizes.length)];
          setEarnedTools(prev => [...prev, prize]);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 800);
      } else {
        setTimeout(setupRound, 800);
      }
    } else {
      playSound('wrong');
      setGuessedIncorrectly(prev => [...prev, guess]);
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setEarnedTools([]);
    setupRound();
  };

  if (correctLength === 0) return null;

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-b from-[#fef3c7] to-[#fde68a] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-[#334155]">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#334155] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-auto mb-auto flex flex-col items-center p-6 bg-white rounded-[32px] border-[6px] border-[#f97316] shadow-[0_20px_40px_rgba(249,115,22,0.15)]">
        
        <div className="flex justify-between w-full text-xl font-bold text-[#f97316] mb-2 px-2">
          <div>Jobs Done: <span>{score}</span></div>
          <div className="text-[#b45309]">Target: {MAX_SCORE}</div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-[#1d4ed8] mb-1">How long is it?</h2>
        <p className="font-bold text-[#64748b] text-base mb-6">Look at where the block stops on the ruler!</p>

        {/* Workbench */}
        <div className="w-full bg-[#f8fafc] border-4 border-[#cbd5e1] rounded-3xl p-5 mb-6 shadow-inner">
          <div className="h-[50px] mb-4 flex items-center justify-start w-full relative">
            <motion.div 
              className="h-[35px] bg-gradient-to-br from-[#ff7043] to-[#f4511e] border-[3px] border-[#bf360c] rounded-lg shadow-[0_4px_0_#d84315,inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center font-bold text-white text-xl text-shadow overflow-hidden whitespace-nowrap"
              initial={{ width: 0 }}
              animate={{ width: `${correctLength * 20}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 10 }}
            >
              {toyLabel}
            </motion.div>
          </div>

          <div className="grid grid-cols-5 w-full relative bg-[#fde047] border-4 border-[#b45309] rounded-xl h-[65px] shadow-[0_4px_0_#78350f]">
            <span className="absolute left-[5px] bottom-[4px] font-black text-lg text-[#b45309]">0</span>
            {[1, 2, 3, 4, 5].map(num => (
              <div key={num} className={`relative border-r-[3px] ${num === 5 ? 'border-transparent' : 'border-[#b45309]'} h-full box-border`}>
                <div className="absolute right-[-3px] top-0 w-[3px] h-[24px] bg-[#b45309]" />
                <div className="absolute right-[50%] top-0 w-[2px] h-[12px] bg-[#b45309]" />
                <span className="absolute right-[-7px] bottom-[4px] font-black text-lg text-[#b45309]">{num}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-4 w-full mb-6">
          {choices.map((c, idx) => {
            const isIncorrect = guessedIncorrectly.includes(c);
            const isCorrect = isRevealed && c === correctLength;
            return (
              <motion.button
                key={idx}
                whileHover={!isRevealed && !isIncorrect ? { scale: 1.05 } : {}}
                whileTap={!isRevealed && !isIncorrect ? { scale: 0.95 } : {}}
                onClick={() => handleChoice(c)}
                disabled={isRevealed || isIncorrect}
                className={`rounded-[20px] font-bold text-2xl py-3 border-[3px] transition-colors ${
                  isCorrect 
                    ? 'bg-[#22c55e] text-white border-[#16a34a] shadow-[0_6px_0_#15803d]' 
                    : isIncorrect
                      ? 'bg-[#94a3b8] text-white border-[#64748b] shadow-[0_6px_0_#475569]'
                      : 'bg-[#1d4ed8] text-white border-[#1e3a8a] shadow-[0_6px_0_#1e3a8a]'
                }`}
              >
                {c} in
              </motion.button>
            );
          })}
        </div>

        {/* Toolbox */}
        <div className="w-full bg-[#f1f5f9] border-t-4 border-[#f97316] rounded-xl p-2 mt-4">
          <div className="text-[0.75rem] text-[#94a3b8] font-bold uppercase mb-1">Your Golden Toolbox</div>
          <div className="flex justify-center gap-2 text-3xl min-h-[35px]">
            {earnedTools.map((t, i) => <span key={i}>{t}</span>)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <h2 className="text-[#f97316] m-0 text-4xl md:text-5xl font-extrabold mb-2">🔨 Master Builder! 🔨</h2>
            <p className="text-2xl text-[#475569] font-bold mb-4">You earned a new tool:</p>
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[8rem] leading-none mb-8"
            >
              {earnedTools[earnedTools.length - 1] || '🛠️'}
            </motion.div>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#f97316] hover:bg-[#c2410c] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_6px_0_#c2410c] hover:shadow-[0_2px_0_#c2410c] hover:translate-y-1 transition-all">
                Play Again! 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
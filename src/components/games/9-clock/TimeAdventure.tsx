import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
  } else {
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

interface TimeAdventureProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function TimeAdventure({ onComplete, allowSkip = true }: TimeAdventureProps) {
  const MAX_SCORE = 10;
  const canReplay = allowSkip !== false;
  const CHARACTERS = ['🐻', '🐱', '🐸'];

  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [answeredItems, setAnsweredItems] = useState(0);
  const [level, setLevel] = useState(1);
  const [character, setCharacter] = useState(CHARACTERS[0]);
  const [targetHour, setTargetHour] = useState(12);
  const [options, setOptions] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const startGame = () => {
    setGameState('playing');
    setupRound(0);
  };

  const setupRound = (currentScore: number) => {
    const hour = Math.floor(Math.random() * 12) + 1;
    setTargetHour(hour);

    const correctAnswer = `${hour}:00`;
    const newOptions = new Set<string>();
    newOptions.add(correctAnswer);

    while (newOptions.size < 4) {
      const wrongHour = Math.floor(Math.random() * 12) + 1;
      newOptions.add(`${wrongHour}:00`);
    }

    const shuffled = Array.from(newOptions).sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setLevel(Math.floor(currentScore / 5) + 1);
    setFeedback('none');
    setSelectedIndex(null);
    setCanClick(true);
  };

  const handleChoice = (index: number, option: string) => {
    if (!canClick) {
      return;
    }

    setCanClick(false);
    setSelectedIndex(index);
    const newAttempts = attempts + 1;
    setAttempts(prev => prev + 1);
    const newAnsweredItems = answeredItems + 1;
    setAnsweredItems(prev => prev + 1);

    const isCorrect = option === `${targetHour}:00`;

    if (allowSkip === false && newAnsweredItems >= MAX_SCORE) {
      setTimeout(() => {
        setIsCompleted(true);
        playSound('fanfare');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }, 1000);
    } else if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          if (allowSkip !== false) onComplete?.(newScore, newAttempts);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(() => setupRound(newScore), 1200);
      }
    } else {
      playSound('wrong');
      setFeedback('wrong');
      if (allowSkip === false) {
        setTimeout(() => setupRound(score), 1200);
      } else {
        setTimeout(() => {
          setCanClick(true);
          setFeedback('none');
          setSelectedIndex(null);
        }, 1200);
      }
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setAnsweredItems(0);
    setLevel(1);
    setIsCompleted(false);
    setGameState('menu');
  };

  const ClockFace = ({ hour }: { hour: number }) => {
    const hourAngle = (hour % 12) * 30;

    return (
      <svg width="250" height="250" viewBox="0 0 250 250" className="drop-shadow-lg">
        <circle cx="125" cy="125" r="115" fill="white" stroke="#333" strokeWidth="6" />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
          const angle = (num * Math.PI) / 6 - Math.PI / 2;
          const x = 125 + Math.cos(angle) * 85;
          const y = 125 + Math.sin(angle) * 85;
          return (
            <text
              key={num}
              x={x}
              y={y}
              fill="#333"
              fontSize="24"
              fontWeight="bold"
              fontFamily="Arial"
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {num}
            </text>
          );
        })}
        <line x1="125" y1="125" x2="125" y2="35" stroke="#777" strokeWidth="5" strokeLinecap="round" />
        <motion.line
          x1="125"
          y1="125"
          x2="125"
          y2="65"
          stroke="#000"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ rotate: hourAngle }}
          animate={{ rotate: hourAngle }}
          transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          style={{ originX: '125px', originY: '125px' }}
        />
        <circle cx="125" cy="125" r="8" fill="#333" />
      </svg>
    );
  };

  if (gameState === 'menu') {
    return (
      <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-[3rem] border-4 border-white bg-gradient-to-t from-[#a6c1ee] to-[#fbc2eb] p-6 font-display text-center shadow-sm select-none">
        <div className="z-10 mb-4 flex w-full justify-center md:justify-end">
          {onComplete && allowSkip !== false && (
            <Button
              variant="ghost"
              className="w-full max-w-sm justify-center md:w-auto bg-white/20 font-bold text-white hover:bg-white/40"
              onClick={() => onComplete?.()}
            >
              Skip <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl mb-6 font-black tracking-wide text-white drop-shadow-lg">
          ⏰ Time Adventure ⏰
        </h1>
        <p className="mb-4 max-w-md text-lg font-bold leading-snug text-white drop-shadow-md md:mb-6 md:text-2xl">
          Piliin ang nais mong gamiting mukha:
        </p>

        <div className="mb-10 grid w-full max-w-md grid-cols-2 gap-3 md:mb-12 md:flex md:w-auto md:max-w-none md:gap-4">
          {CHARACTERS.map((char) => (
            <motion.button
              key={char}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCharacter(char)}
              className={`flex h-24 w-full items-center justify-center rounded-2xl border-4 bg-white/40 p-3 text-5xl backdrop-blur-md transition-colors md:h-auto md:w-auto md:p-4 md:text-6xl ${
                character === char ? 'border-[#333] bg-white/60' : 'border-transparent'
              }`}
            >
              {char}
            </motion.button>
          ))}
        </div>

        <Button
          size="lg"
          onClick={startGame}
          className="h-16 rounded-full bg-white px-10 text-2xl font-bold text-[#a6c1ee] shadow-lg transition-all hover:-translate-y-1 hover:bg-gray-100 hover:shadow-xl"
        >
          ▶️ Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col items-center overflow-hidden rounded-[3rem] border-4 border-white bg-gradient-to-t from-[#a6c1ee] to-[#fbc2eb] p-6 font-display text-center shadow-sm select-none">
      <div className="z-10 mb-2 flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {allowSkip !== false && (
          <Button
            variant="ghost"
            className="w-full max-w-sm justify-center md:w-auto bg-white/20 font-bold text-white hover:bg-white/40"
            onClick={resetGame}
          >
            <ArrowLeft className="mr-1 h-5 w-5" /> Back
          </Button>
        )}
        {onComplete && allowSkip !== false && (
          <Button
            variant="ghost"
            className="w-full max-w-sm justify-center md:w-auto bg-white/20 font-bold text-white hover:bg-white/40"
            onClick={() => onComplete?.()}
          >
            Skip <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-white drop-shadow-md md:justify-between md:px-4 md:text-xl">
        <div>
          Score: <span>{score}</span>
        </div>
        <div>
          Level: <span>{level}</span>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl mb-2 font-black tracking-wide text-white drop-shadow-lg">
        ⏰ Time Adventure ⏰
      </h1>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="mb-4 text-[4rem] leading-none drop-shadow-lg"
      >
        {character}
      </motion.div>

      <div className="relative z-10 flex w-full max-w-[500px] flex-grow flex-col items-center rounded-3xl border-[4px] border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-md">
        <div className="mb-2 flex h-[40px] items-center justify-center text-xl font-bold md:text-2xl">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div
                key="correct"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-[#2e7d32]"
              >
                ⭐ Great Job! ⭐
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div
                key="wrong"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-[#c62828]"
              >
                Look closely at the short hand!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-8">
          <ClockFace hour={targetHour} />
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          {options.map((opt, index) => {
            const isSelected = selectedIndex === index;
            const bgColor = isSelected ? (feedback === 'correct' ? '#a5d6a7' : '#ef9a9a') : '#ffffff';

            return (
              <motion.button
                key={index}
                whileHover={canClick ? { scale: 1.05 } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
                animate={{ backgroundColor: bgColor }}
                className="rounded-2xl border-4 border-[#a6c1ee] py-4 text-2xl font-bold text-[#333] shadow-sm md:text-3xl"
                onClick={() => handleChoice(index, opt)}
              >
                {opt}
              </motion.button>
            );
          })}
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
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mb-4 text-[6rem] leading-none drop-shadow-lg"
            >
              ⏰
            </motion.div>
            <h1 className="mb-4 text-4xl font-extrabold text-[#a6c1ee] drop-shadow-sm md:text-5xl">
              Time Master!
            </h1>
            <p className="mb-8 text-2xl font-bold text-gray-700">
              You learned how to read the clock perfectly!
            </p>

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
                className="h-16 rounded-full bg-[#a6c1ee] px-10 text-2xl font-bold text-white shadow-[0_4px_0_#7598cf] transition-all hover:translate-y-1 hover:bg-[#85a8df] hover:shadow-[0_2px_0_#7598cf]"
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

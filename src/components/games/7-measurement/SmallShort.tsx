import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight, Star } from 'lucide-react';

const playTrainSound = (type: 'correct' | 'wrong' | 'choo' | 'fanfare') => {
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
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'choo') {
    [0, 0.2].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now + delay);
      osc.frequency.exponentialRampToValueAtTime(800, now + delay + 0.1);
      gain.gain.setValueAtTime(0.1, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
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
  }
};

const gameData = [
  { img: '🌳', name: 'tree' },
  { img: '⚽', name: 'ball' },
  { img: '🏰', name: 'tower' },
  { img: '🍎', name: 'apple' },
  { img: '🐍', name: 'snake' },
  { img: '🎁', name: 'gift' },
  { img: '🦒', name: 'giraffe' },
  { img: '📏', name: 'ruler' },
];

interface SmallShortProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function SmallShort({ onComplete, allowSkip = true }: SmallShortProps) {
  const MAX_SCORE = 10;
  const isAssignedMode = allowSkip === false;
  const canReplay = !isAssignedMode;
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetSize, setTargetSize] = useState<'BIG' | 'SMALL'>('BIG');
  const [activeItem, setActiveItem] = useState(gameData[0]);
  const [choices, setChoices] = useState<('BIG' | 'SMALL')[]>(['BIG', 'SMALL']);
  const [trainState, setTrainState] = useState<'entering' | 'waiting' | 'leaving'>('entering');
  const [car2Content, setCar2Content] = useState<'BIG' | 'SMALL' | null>(null);
  const [message, setMessage] = useState('Load the Train!');

  const generateLevel = () => {
    const randomObj = gameData[Math.floor(Math.random() * gameData.length)];
    setActiveItem(randomObj);
    const target = Math.random() > 0.5 ? 'BIG' : 'SMALL';
    setTargetSize(target);
    setCar2Content(null);
    setTrainState('entering');

    const sizeWord = target === 'BIG' ? 'BIG/TALL' : 'SMALL/SHORT';
    setMessage(`Find the ${sizeWord} ${randomObj.name}!`);
    setChoices(['BIG', 'SMALL'].sort(() => Math.random() - 0.5) as ('BIG' | 'SMALL')[]);

    setTimeout(() => {
      setTrainState('waiting');
    }, 1500);
  };

  useEffect(() => {
    generateLevel();
  }, []);

  const finishRound = (newScore: number, newAttempts: number) => {
    const didCompleteAssignedQuiz = isAssignedMode && newAttempts >= MAX_SCORE;

    if (didCompleteAssignedQuiz || newScore >= MAX_SCORE) {
      setIsCompleted(true);
      if (!isAssignedMode) onComplete?.(newScore, newAttempts);
      playTrainSound('fanfare');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else {
      generateLevel();
    }
  };

  const departTrain = (newScore: number, newAttempts: number) => {
    playTrainSound('choo');
    setMessage('CHOO CHOO! 🚂💨');
    setTrainState('leaving');

    setTimeout(() => {
      finishRound(newScore, newAttempts);
    }, 1500);
  };

  const handleChoice = (size: 'BIG' | 'SMALL') => {
    if (trainState !== 'waiting' || car2Content !== null) return;
    const newAttempts = attempts + 1;
    setAttempts(prev => prev + 1);

    if (size === targetSize) {
      playTrainSound('correct');
      setCar2Content(size);
      setMessage('EXCELLENT! 🌟');

      setTimeout(() => {
        const newScore = score + 1;
        setScore(newScore);
        departTrain(newScore, newAttempts);
      }, 800);
    } else if (isAssignedMode) {
      playTrainSound('wrong');
      setCar2Content(size);
      setMessage('Nice try! Next train! 🚂');

      setTimeout(() => {
        departTrain(score, newAttempts);
      }, 800);
    } else {
      playTrainSound('wrong');
      setMessage('Oops! Try the other one! 🧐');
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setIsCompleted(false);
    generateLevel();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#81d4fa] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden font-display z-0">
      <div className="mb-4 flex w-full justify-center md:justify-end z-10">
        {onComplete && allowSkip !== false && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#0288d1] font-bold bg-white/50 hover:bg-white" onClick={() => onComplete?.()}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[30%] bg-[#81c784] border-t-[10px] border-[#66bb6a] z-[-1]" />

      <motion.div
        className="absolute w-[100px] h-[40px] bg-white rounded-full top-[10%] opacity-80 z-[-1]"
        animate={{ left: ['-150px', '100%'] }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[100px] h-[40px] bg-white rounded-full top-[25%] opacity-80 z-[-1]"
        animate={{ left: ['-150px', '100%'] }}
        transition={{ repeat: Infinity, duration: 35, ease: 'linear', delay: 5 }}
      />

      <div className="z-10 w-full flex flex-col items-center">
        <div className="bg-white px-6 py-2 rounded-full border-4 border-[#ffb300] text-2xl font-bold text-[#e65100] mb-6 shadow-md flex items-center gap-2">
          <Star className="w-6 h-6 fill-[#ffb300] text-[#ffb300]" /> Trains: {score}/{MAX_SCORE}
        </div>

        <div className="bg-white px-8 py-4 rounded-[50px] border-[5px] border-[#0288d1] text-2xl font-bold text-[#2d3436] mb-8 shadow-lg text-center min-w-[280px]">
          {message}
        </div>

        <div className="relative w-full max-w-3xl h-[180px] bg-[#90a4ae]/80 border-b-[15px] border-[#455a64] rounded-2xl my-8 overflow-hidden shadow-inner">
          <motion.div
            className="absolute bottom-[20px] flex flex-row-reverse gap-2 items-end"
            initial={{ left: '-50%', x: '-50%' }}
            animate={{
              left: trainState === 'entering' ? '-50%' : trainState === 'waiting' ? '50%' : '150%',
              x: '-50%',
            }}
            transition={{
              duration: 1.5,
              ease: trainState === 'waiting' ? 'easeOut' : 'easeIn',
            }}
          >
            <div className="text-[3rem] md:text-[4.5rem] leading-none transform scale-x-[-1] drop-shadow-md">🚂</div>

            <div className="w-[80px] h-[64px] md:w-[95px] md:h-[70px] bg-[#ff7675] border-4 border-[#2d3436] rounded-xl flex items-end justify-center relative shadow-sm">
              <div className="absolute -bottom-[18px] text-lg text-[#2d3436] font-black tracking-widest z-10">● ●</div>
              <div className={`text-[3rem] mb-1 leading-none origin-bottom ${targetSize === 'BIG' ? 'scale-[0.6]' : 'scale-[1.4]'}`}>
                {activeItem.img}
              </div>
            </div>

            <div className="w-[80px] h-[64px] md:w-[95px] md:h-[70px] bg-[#4fc3f7] border-4 border-[#2d3436] rounded-xl flex items-end justify-center relative shadow-sm">
              <div className="absolute -bottom-[18px] text-lg text-[#2d3436] font-black tracking-widest z-10">● ●</div>
              <div className={`mb-1 leading-none flex items-end origin-bottom ${car2Content ? (car2Content === 'BIG' ? 'text-[3rem] scale-[1.4]' : 'text-[3rem] scale-[0.6]') : 'text-[2.5rem]'}`}>
                {car2Content ? activeItem.img : '❓'}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex gap-4 justify-center bg-white/30 p-4 rounded-[30px] backdrop-blur-sm shadow-md mt-auto">
          {choices.map((choice, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChoice(choice)}
              className="bg-white border-[5px] border-[#ffb300] rounded-3xl w-[100px] h-[100px] flex items-center justify-center text-[3rem] cursor-pointer shadow-[0_8px_0_#e65100]"
            >
              <div className={`leading-none origin-bottom ${choice === 'BIG' ? 'scale-[1.4]' : 'scale-[0.6]'}`}>
                {activeItem.img}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#81d4fa]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="text-[8rem] leading-none mb-4"
            >
              🏆✨
            </motion.div>
            <h1 className="text-[#e65100] text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-sm">MEASUREMENT STAR!</h1>
            <p className="text-2xl text-slate-800 font-bold mb-8">
              {isAssignedMode ? 'You answered 10 train rounds!' : 'You loaded 10 trains!'}
            </p>

            <div className="flex gap-4">
              {allowSkip === false && onComplete && (
                <Button size="lg" variant="jungle" onClick={() => onComplete?.(score, MAX_SCORE)} className="text-xl px-8 h-16 rounded-full shadow-lg">
                  Next Game <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
              {canReplay && (
                <Button size="lg" onClick={resetGame} className="bg-[#4caf50] hover:bg-[#388e3c] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_6px_0_#2e7d32] hover:shadow-[0_2px_0_#2e7d32] hover:translate-y-1 transition-all">
                  Play Again! 🔄
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

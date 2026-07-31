import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ArrowLeft, ChevronRight } from 'lucide-react';

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

interface TimeAdventureProps {
  onComplete?: () => void;
}

export function TimeAdventure({ onComplete }: TimeAdventureProps) {
  const MAX_SCORE = 10;
  const CHARACTERS = ['🐻', '🐱', '🐸'];

  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [score, setScore] = useState(0);
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
    // Pick random hour
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
    
    // Update level
    setLevel(Math.floor(currentScore / 5) + 1);
    
    setFeedback('none');
    setSelectedIndex(null);
    setCanClick(true);
  };

  const handleChoice = (index: number, option: string) => {
    if (!canClick) return;
    setCanClick(false);
    setSelectedIndex(index);

    const isCorrect = option === `${targetHour}:00`;

    if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(() => setupRound(newScore), 1200);
      }
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        setCanClick(true);
        setFeedback('none');
        setSelectedIndex(null);
      }, 1200);
    }
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setIsCompleted(false);
    setGameState('menu');
  };

  // SVG Clock component for cleaner rendering
  const ClockFace = ({ hour }: { hour: number }) => {
    const hourAngle = (hour % 12) * 30; // 360 / 12 = 30 degrees per hour
    
    return (
      <svg width="250" height="250" viewBox="0 0 250 250" className="drop-shadow-lg">
        {/* Background */}
        <circle cx="125" cy="125" r="115" fill="white" stroke="#333" strokeWidth="6" />
        
        {/* Numbers */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const angle = (num * Math.PI) / 6 - Math.PI / 2; // Shift by -90deg so 12 is at top
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
        
        {/* Minute Hand (always at 12 for full hours) */}
        <line x1="125" y1="125" x2="125" y2="35" stroke="#777" strokeWidth="5" strokeLinecap="round" />
        
        {/* Hour Hand */}
        <motion.line 
          x1="125" y1="125" 
          x2="125" y2="65" 
          stroke="#000" 
          strokeWidth="10" 
          strokeLinecap="round" 
          initial={{ rotate: hourAngle }}
          animate={{ rotate: hourAngle }}
          transition={{ type: "spring", stiffness: 100, damping: 12 }}
          style={{ originX: "125px", originY: "125px" }}
        />
        
        {/* Center Pin */}
        <circle cx="125" cy="125" r="8" fill="#333" />
      </svg>
    );
  };

  if (gameState === 'menu') {
    return (
      <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-gradient-to-t from-[#a6c1ee] to-[#fbc2eb] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
        {/* Skip Button */}
        <div className="absolute top-6 right-6 z-50">
          {onComplete && (
            <Button variant="ghost" className="text-white font-bold bg-white/20 hover:bg-white/40" onClick={onComplete}>
              Skip <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
          )}
        </div>
        
        <h1 className="text-white text-5xl md:text-6xl font-black mb-8 drop-shadow-lg tracking-wide">⏰ Time Adventure ⏰</h1>
        <p className="text-2xl text-white font-bold mb-6 drop-shadow-md">Piliin ang nais mong gamiting mukha:</p>
        
        <div className="flex gap-4 mb-12">
          {CHARACTERS.map(char => (
            <motion.button
              key={char}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCharacter(char)}
              className={`text-6xl p-4 bg-white/40 backdrop-blur-md rounded-2xl border-4 transition-colors ${character === char ? 'border-[#333] bg-white/60' : 'border-transparent'}`}
            >
              {char}
            </motion.button>
          ))}
        </div>

        <Button size="lg" onClick={startGame} className="bg-white text-[#a6c1ee] hover:bg-gray-100 text-2xl font-bold h-16 px-10 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
          ▶️ Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-t from-[#a6c1ee] to-[#fbc2eb] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      <div className="absolute top-6 left-6 z-50">
        <Button
          variant="ghost"
          className="text-white font-bold bg-white/20 hover:bg-white/40"
          onClick={resetGame}
        >
          <ArrowLeft className="mr-1 w-5 h-5" /> Back
        </Button>
      </div>
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-white font-bold bg-white/20 hover:bg-white/40" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full flex justify-between text-xl font-bold text-white mb-2 drop-shadow-md px-4">
        <div>Score: <span>{score}</span></div>
        <div>Level: <span>{level}</span></div>
      </div>

      <h1 className="text-white text-4xl font-black mb-2 drop-shadow-lg tracking-wide">⏰ Time Adventure ⏰</h1>
      
      {/* Character Helper */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-[4rem] leading-none mb-4 drop-shadow-lg"
      >
        {character}
      </motion.div>

      <div className="w-full max-w-[500px] flex flex-col items-center z-10 flex-grow bg-white/40 backdrop-blur-md border-[4px] border-white/60 rounded-3xl p-6 shadow-xl relative">
        
        {/* Feedback Message */}
        <div className="h-[40px] flex items-center justify-center font-bold text-2xl mb-2">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div key="correct" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#2e7d32]">
                ⭐ Great Job! ⭐
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div key="wrong" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#c62828]">
                Look closely at the short hand!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clock Area */}
        <div className="mb-8">
          <ClockFace hour={targetHour} />
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {options.map((opt, index) => {
            const isSelected = selectedIndex === index;
            const bgColor = isSelected 
              ? (feedback === 'correct' ? '#a5d6a7' : '#ef9a9a')
              : '#ffffff';

            return (
              <motion.button
                key={index}
                whileHover={canClick ? { scale: 1.05 } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
                animate={{ backgroundColor: bgColor }}
                className="py-4 text-3xl font-bold text-[#333] border-4 border-[#a6c1ee] rounded-2xl shadow-sm"
                onClick={() => handleChoice(index, opt)}
              >
                {opt}
              </motion.button>
            );
          })}
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
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              ⏰
            </motion.div>
            <h1 className="text-[#a6c1ee] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">Time Master!</h1>
            <p className="text-2xl text-gray-700 font-bold mb-8">You learned how to read the clock perfectly!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#a6c1ee] hover:bg-[#85a8df] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#7598cf] hover:shadow-[0_2px_0_#7598cf] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

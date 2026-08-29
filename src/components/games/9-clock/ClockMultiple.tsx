import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

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
  }
};

const NUMBER_WORDS = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"
];

const MiniClock = ({ hour }: { hour: number }) => {
  const hourAngle = (hour % 12) * 30; 
  
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="pointer-events-none">
      <circle cx="70" cy="70" r="65" fill="white" stroke="#ff9800" strokeWidth="8" />
      
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
        const angle = (num * Math.PI) / 6 - Math.PI / 2;
        const x = 70 + Math.cos(angle) * 50;
        const y = 70 + Math.sin(angle) * 50;
        return (
          <text 
            key={num}
            x={x} 
            y={y} 
            fill="#00838f" 
            fontSize="14" 
            fontWeight="bold" 
            fontFamily="'Comic Sans MS', cursive, sans-serif"
            textAnchor="middle" 
            alignmentBaseline="central"
          >
            {num}
          </text>
        );
      })}
      
      <line x1="70" y1="70" x2="70" y2="25" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      
      <line 
        x1="70" y1="70" 
        x2="70" y2="40" 
        stroke="#d32f2f" 
        strokeWidth="6" 
        strokeLinecap="round" 
        transform={`rotate(${hourAngle} 70 70)`}
      />
      
      <circle cx="70" cy="70" r="5" fill="#333" />
    </svg>
  );
};

interface ClockMultipleProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function ClockMultiple({ onComplete, allowSkip = true }: ClockMultipleProps) {
  const MAX_SCORE = 12;
  const canReplay = allowSkip !== false;
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [answeredItems, setAnsweredItems] = useState(0);
  const [targetHour, setTargetHour] = useState(12);
  const [options, setOptions] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  const setupRound = () => {
    const hour = Math.floor(Math.random() * 12) + 1;
    setTargetHour(hour);

    const newOptions = new Set<number>();
    newOptions.add(hour);

    // Ensure absolutely NO duplicate options (e.g. no two 7:00s)
    while (newOptions.size < 3) {
      const wrongHour = Math.floor(Math.random() * 12) + 1;
      newOptions.add(wrongHour);
    }

    const shuffled = Array.from(newOptions).sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    
    setFeedback('none');
    setSelectedIndex(null);
    setCanClick(true);
  };

  const advanceAssignedRound = (newAnsweredItems: number) => {
    if (allowSkip !== false) return false;

    setTimeout(() => {
      if (newAnsweredItems >= MAX_SCORE) {
        setIsCompleted(true);
        playSound('fanfare');
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
      } else {
        setupRound();
      }
    }, 1500);
    return true;
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleChoice = (index: number, opt: number) => {
    if (!canClick) return;
    const newAttempts = attempts + 1;
    setAttempts(prev => prev + 1);
    const newAnsweredItems = answeredItems + 1;
    setAnsweredItems(prev => prev + 1);
    setCanClick(false);
    setSelectedIndex(index);

    const isCorrect = opt === targetHour;

    if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      if (advanceAssignedRound(newAnsweredItems)) {
        return;
      }

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          if (allowSkip !== false) onComplete?.(newScore, newAttempts);
          playSound('fanfare');
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
        }, 1500);
      } else {
        setTimeout(() => setupRound(), 1500);
      }
    } else {
      playSound('wrong');
      setFeedback('wrong');
      if (advanceAssignedRound(newAnsweredItems)) {
        return;
      }
      setTimeout(() => {
        setCanClick(true);
        setFeedback('none');
        setSelectedIndex(null);
      }, 1500);
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setAnsweredItems(0);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#e0f7fa] to-[#b2ebf2] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="mb-2 flex w-full justify-center md:justify-end z-10">
        {onComplete && allowSkip !== false && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#00838f] font-bold bg-[#00838f]/10 hover:bg-[#00838f]/20" onClick={() => onComplete?.()}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-[#00838f] md:justify-start md:px-4 md:text-xl">
        Score: {score} / {MAX_SCORE}
      </div>

      <div className="mb-12 mt-8 flex flex-col items-center">
        <h2 className="text-[#006064] text-2xl md:text-5xl font-black mb-4 drop-shadow-sm font-['Comic_Sans_MS']">
          What time is it?
        </h2>
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 rounded-3xl border-4 border-white shadow-md">
          <p className="text-[#d32f2f] text-2xl md:text-5xl font-extrabold font-['Comic_Sans_MS'] text-center break-words">
            ({targetHour}:00) {NUMBER_WORDS[targetHour]} o'clock?
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 w-full max-w-[800px] z-20">
        {options.map((opt, index) => {
          const isSelected = selectedIndex === index;
          
          let btnClass = "bg-white border-4 border-[#00bcd4] hover:bg-[#e0f7fa]";
          if (isSelected) {
            if (feedback === 'correct') {
              btnClass = "bg-[#c8e6c9] border-[#4caf50] shadow-[0_0_15px_#4caf50]"; 
            } else if (feedback === 'wrong') {
              btnClass = "bg-[#ffcdd2] border-[#f44336] shadow-[0_0_15px_#f44336]"; 
            }
          }

          return (
            <motion.button
              key={index + '-' + opt}
              whileHover={canClick ? { scale: 1.05 } : {}}
              whileTap={canClick ? { scale: 0.95 } : {}}
              className={`p-6 rounded-[2rem] shadow-lg transition-colors ${btnClass}`}
              onClick={() => handleChoice(index, opt)}
            >
              <MiniClock hour={opt} />
            </motion.button>
          );
        })}
      </div>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#e0f7fa]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🏆
            </motion.div>
            <h1 className="text-[#00838f] text-4xl md:text-5xl font-extrabold mb-4">You got them all!</h1>
            
            <div className="flex gap-4 mt-8">
              {canReplay && (
                <Button size="lg" onClick={resetGame} className="bg-[#4caf50] hover:bg-[#388e3c] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#2e7d32] hover:shadow-[0_2px_0_#2e7d32] hover:translate-y-1 transition-all">
                  Play Again 🔄
                </Button>
              )}
              {allowSkip === false && onComplete && (
                <Button size="lg" onClick={() => onComplete?.(score, MAX_SCORE)} className="bg-[#ff9800] hover:bg-[#f57c00] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#ef6c00] hover:shadow-[0_2px_0_#ef6c00] hover:translate-y-1 transition-all">
                  Next <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

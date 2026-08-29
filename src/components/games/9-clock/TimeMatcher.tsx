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
  }
};

interface TimeMatcherProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function TimeMatcher({ onComplete, allowSkip = true }: TimeMatcherProps) {
  const MAX_SCORE = 10;

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [answeredItems, setAnsweredItems] = useState(0);
  const [targetHour, setTargetHour] = useState(12);
  const [options, setOptions] = useState<number[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const setupRound = () => {
    // Pick random hour
    const hour = Math.floor(Math.random() * 12) + 1;
    setTargetHour(hour);

    const newOptions = new Set<number>();
    newOptions.add(hour);

    while (newOptions.size < 4) {
      const wrongHour = Math.floor(Math.random() * 12) + 1;
      newOptions.add(wrongHour);
    }

    const shuffled = Array.from(newOptions).sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    
    setFeedback('none');
    setSelectedIndex(null);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleChoice = (index: number, opt: number) => {
    if (!canClick) return;
    setCanClick(false);
    setSelectedIndex(index);
    const newAttempts = attempts + 1;
    setAttempts(prev => prev + 1);
    const newAnsweredItems = answeredItems + 1;
    setAnsweredItems(prev => prev + 1);

    const isCorrect = opt === targetHour;

    if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      if (allowSkip === false && newAnsweredItems >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1500);
      } else if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          if (allowSkip !== false) onComplete?.(newScore, newAttempts);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1500);
      } else {
        setTimeout(() => setupRound(), 1500);
      }
    } else {
      playSound('wrong');
      setFeedback('wrong');
      if (allowSkip === false) {
        if (newAnsweredItems >= MAX_SCORE) {
          setTimeout(() => {
            setIsCompleted(true);
            playSound('fanfare');
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          }, 1500);
        } else {
          setTimeout(() => setupRound(), 1500);
        }
      } else {
        setTimeout(() => {
          setCanClick(true);
          setFeedback('none');
          setSelectedIndex(null);
        }, 1500);
      }
    }
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setAnsweredItems(0);
    setIsCompleted(false);
    setupRound();
  };

  // SVG Clock Component mimicking the orange-bordered design in TimeMatcher
  const ClockFace = ({ hour }: { hour: number }) => {
    const hourAngle = (hour % 12) * 30; // 360 / 12 = 30 degrees per hour
    
    return (
      <svg width="260" height="260" viewBox="0 0 260 260" className="drop-shadow-lg mb-6">
        {/* Border / Outer Ring */}
        <circle cx="130" cy="130" r="120" fill="white" stroke="#ff9800" strokeWidth="20" />
        
        {/* Numbers */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const angle = (num * Math.PI) / 6 - Math.PI / 2; // Shift by -90deg so 12 is at top
          // Pull numbers slightly inward from the edge
          const x = 130 + Math.cos(angle) * 85;
          const y = 130 + Math.sin(angle) * 85;
          return (
            <text 
              key={num}
              x={x} 
              y={y} 
              fill="#00838f" 
              fontSize="24" 
              fontWeight="bold" 
              fontFamily="'Comic Sans MS', cursive, sans-serif"
              textAnchor="middle" 
              alignmentBaseline="central"
            >
              {num}
            </text>
          );
        })}
        
        {/* Minute Hand (always at 12) */}
        <line x1="130" y1="130" x2="130" y2="40" stroke="#333" strokeWidth="6" strokeLinecap="round" />
        
        {/* Hour Hand */}
        <motion.line 
          x1="130" y1="130" 
          x2="130" y2="70" 
          stroke="#d32f2f" 
          strokeWidth="10" 
          strokeLinecap="round" 
          initial={{ rotate: hourAngle }}
          animate={{ rotate: hourAngle }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          style={{ originX: "130px", originY: "130px" }}
        />
        
        {/* Center Pin */}
        <circle cx="130" cy="130" r="8" fill="#333" />
      </svg>
    );
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6 bg-[#e0f7fa] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none overflow-hidden text-center">
      
      {/* Skip Button */}
      <div className="mb-2 flex w-full justify-center md:justify-end z-10">
        {onComplete && allowSkip !== false && (
          <Button variant="ghost" className="w-full max-w-sm justify-center md:w-auto text-[#006064] font-bold bg-[#006064]/10 hover:bg-[#006064]/20" onClick={() => onComplete?.()}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-lg font-bold text-[#006064] md:justify-start md:px-4 md:text-xl">
        Score: {score} / {MAX_SCORE}
      </div>

      <h1 className="text-[#006064] text-2xl md:text-4xl font-black mb-8 tracking-wide font-['Comic_Sans_MS']">
        What time is it?
      </h1>
      
      <ClockFace hour={targetHour} />

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-[500px]">
        {options.map((opt, index) => {
          const isSelected = selectedIndex === index;
          
          let btnClass = "bg-[#4caf50] hover:bg-[#388e3c] text-white";
          if (isSelected) {
            if (feedback === 'correct') {
              btnClass = "bg-[#ffeb3b] text-[#333]"; // Yellow for correct flash
            } else if (feedback === 'wrong') {
              btnClass = "bg-[#d32f2f] text-white"; // Red for wrong
            }
          }

          return (
            <motion.button
              key={index}
              whileHover={canClick ? { scale: 1.05 } : {}}
              whileTap={canClick ? { scale: 0.95 } : {}}
              className={`py-4 px-8 text-2xl font-bold rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-colors ${btnClass}`}
              onClick={() => handleChoice(index, opt)}
            >
              {opt}:00
            </motion.button>
          );
        })}
      </div>

      {/* Feedback Message */}
      <div className="h-[50px] flex items-center justify-center font-bold text-3xl mt-6">
        <AnimatePresence mode="wait">
          {feedback === 'correct' && (
            <motion.div key="correct" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#ffb300] drop-shadow-md">
              ⭐ Great Job! ⭐
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div key="wrong" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#d32f2f]">
              Oops! Try again.
            </motion.div>
          )}
        </AnimatePresence>
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
              🕰️
            </motion.div>
            <h1 className="text-[#00838f] text-4xl md:text-5xl font-extrabold mb-4">Clock Master!</h1>
            
            <div className="flex gap-4 mt-8">
              {allowSkip === false && onComplete && (
              <Button size="lg" variant="jungle" onClick={() => onComplete?.(score, MAX_SCORE)} className="text-xl px-8 h-16 rounded-full shadow-lg">
                  Next Game <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
              <Button size="lg" onClick={resetGame} className="bg-[#4caf50] hover:bg-[#388e3c] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#2e7d32] hover:shadow-[0_2px_0_#2e7d32] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

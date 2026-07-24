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

interface WhichIsLongerProps {
  onComplete?: () => void;
}

export function WhichIsLonger({ onComplete }: WhichIsLongerProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [length1, setLength1] = useState(0);
  const [length2, setLength2] = useState(0);
  const [canClick, setCanClick] = useState(true);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const generateCaterpillar = (length: number) => {
    let cat = '🐛';
    for (let i = 1; i < length; i++) {
      cat += '🟢';
    }
    return cat;
  };

  const setupRound = () => {
    let l1 = Math.floor(Math.random() * 6) + 2;
    let l2 = Math.floor(Math.random() * 6) + 2;
    while (l1 === l2) {
      l2 = Math.floor(Math.random() * 6) + 2;
    }
    setLength1(l1);
    setLength2(l2);
    setFeedback('none');
    setSelectedIndex(null);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleChoice = (index: number, length: number) => {
    if (!canClick) return;
    setCanClick(false);
    setSelectedIndex(index);

    const isLonger = length === Math.max(length1, length2);

    if (isLonger) {
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
        setTimeout(setupRound, 1200);
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
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#e0f7fa] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#00838f] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-[500px] mt-4 flex flex-col items-center z-10 flex-grow bg-white rounded-3xl p-6 shadow-[0_4px_10px_rgba(0,0,0,0.1)] relative">
        
        <h1 className="text-[#006064] text-3xl font-black mb-2">🐛 Which is Longer? 🐛</h1>
        <div className="text-xl text-[#00838f] mb-6 font-bold">Tap or click on the LONGER caterpillar!</div>

        {/* Feedback Message */}
        <div className="h-[40px] flex items-center justify-center font-bold text-2xl">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div key="correct" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#2e7d32]">
                ⭐ Great Job! ⭐
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div key="wrong" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#c62828]">
                Oops! Try again.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Caterpillar 1 */}
        <motion.div
          whileHover={canClick ? { scale: 1.02, backgroundColor: "#80deea" } : {}}
          whileTap={canClick ? { scale: 0.98 } : {}}
          animate={{
            backgroundColor: selectedIndex === 1 
              ? (feedback === 'correct' ? '#a5d6a7' : '#ef9a9a') 
              : '#b2ebf2'
          }}
          className="w-full flex items-center justify-start rounded-xl p-4 my-3 cursor-pointer min-h-[80px] overflow-hidden"
          onClick={() => handleChoice(1, length1)}
        >
          <div className="text-4xl sm:text-5xl whitespace-nowrap">
            {generateCaterpillar(length1)}
          </div>
        </motion.div>

        {/* Caterpillar 2 */}
        <motion.div
          whileHover={canClick ? { scale: 1.02, backgroundColor: "#80deea" } : {}}
          whileTap={canClick ? { scale: 0.98 } : {}}
          animate={{
            backgroundColor: selectedIndex === 2 
              ? (feedback === 'correct' ? '#a5d6a7' : '#ef9a9a') 
              : '#b2ebf2'
          }}
          className="w-full flex items-center justify-start rounded-xl p-4 my-3 cursor-pointer min-h-[80px] overflow-hidden"
          onClick={() => handleChoice(2, length2)}
        >
          <div className="text-4xl sm:text-5xl whitespace-nowrap">
            {generateCaterpillar(length2)}
          </div>
        </motion.div>

        <div className="text-2xl font-bold text-[#ff6f00] mt-6">Score: <span>{score}</span> / {MAX_SCORE}</div>
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
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🐛
            </motion.div>
            <h1 className="text-[#00838f] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">Super Identifier!</h1>
            <p className="text-2xl text-[#006064] font-bold mb-8">You found all the long caterpillars!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#ff6f00] hover:bg-[#e65100] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#e65100] hover:shadow-[0_2px_0_#e65100] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
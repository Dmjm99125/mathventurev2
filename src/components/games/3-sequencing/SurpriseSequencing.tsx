import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Sparkles, Trophy } from 'lucide-react';

const BANKS = {
  numbers: {
    data: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    guide: "Follow the numbers from smallest to biggest! 🔢"
  },
  shapes: {
    data: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫"],
    guide: "Follow the color track order! 🎨"
  },
  animals: {
    data: ["🐥", "🐸", "🐱", "🐶", "🦁", "🐘", "🦒"],
    guide: "Put the animals in a line! 🐾"
  },
  fruit: {
    data: ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓"],
    guide: "Sort the delicious fruits! 🍓"
  }
};

export function SurpriseSequencing({ onComplete }: { onComplete?: () => void }) {
  const [level, setLevel] = useState(1);
  const [bankGuide, setBankGuide] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    startLevel(1);
  }, []);

  const startLevel = (lvl: number) => {
    setLevel(lvl);
    setCurrentIndex(0);
    setErrorMsg('');

    let count = 3;
    if (lvl >= 3) count = 4;
    if (lvl === 5) count = 5;

    const keys = Object.keys(BANKS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)] as keyof typeof BANKS;
    const selectedBank = BANKS[randomKey];

    const startIdx = Math.floor(Math.random() * (selectedBank.data.length - count + 1));
    const newSeq = selectedBank.data.slice(startIdx, startIdx + count);
    
    setSequence(newSeq);
    setBankGuide(selectedBank.guide);
    
    let newShuffled = [...newSeq].sort(() => Math.random() - 0.5);
    while (JSON.stringify(newShuffled) === JSON.stringify(newSeq) && newSeq.length > 1) {
      newShuffled = [...newSeq].sort(() => Math.random() - 0.5);
    }
    
    setShuffled(newShuffled);
  };

  const handleItemClick = (item: string) => {
    if (currentIndex >= sequence.length) return;

    if (item === sequence[currentIndex]) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setErrorMsg('');
      setScore(s => s + 5);
      
      if (currentIndex + 1 === sequence.length) {
        setScore(s => s + 50); // huge points!
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        
        if (level < 5) {
           setTimeout(() => startLevel(level + 1), 2000);
        }
      }
    } else {
      // Wrong!
      setErrorMsg(`❌ Oops! Try the next one!`);
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isLevelDone = currentIndex === sequence.length && level < 5;
  const isCompleted = currentIndex === sequence.length && level === 5;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#fdf2f8] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-pink-200 shrink-0 min-h-[600px]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-pink-100 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-pink-700 uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-pink-500" /> Surprise Sequencing
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700 bg-pink-100 px-4 py-1 rounded-full">Level: <span className="text-pink-600">{level}/5</span></div>
          <div className="text-lg md:text-xl font-bold text-slate-700">Score: <span className="text-pink-600">{score}</span></div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-pink-300 text-pink-700 font-bold hover:bg-pink-50 rounded-xl" onClick={onComplete}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-[#fbcfe8] border-4 border-pink-300 rounded-3xl p-4 md:p-6 mb-8 shadow-sm text-center w-full max-w-2xl">
         <h3 className="text-xl md:text-3xl font-bold text-pink-700 drop-shadow-sm">
            {bankGuide}
         </h3>
      </div>

      {/* Target Area (Placed items) */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-10 w-full max-w-3xl bg-white/50 p-4 md:p-6 rounded-[2rem] border-4 border-dashed border-pink-300 min-h-[160px]">
        <AnimatePresence>
          {/* Placed Items */}
          {sequence.slice(0, currentIndex).map((item) => (
            <motion.div
              key={`placed-${item}`}
              layout
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-16 h-16 md:w-20 md:h-20 bg-[#f472b6] rounded-2xl flex flex-col items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-[0_4px_0_0_#be185d] border-2 border-pink-400 z-10"
            >
               {item}
            </motion.div>
          ))}
          {/* Empty Slots */}
          {sequence.slice(currentIndex).map((item, idx) => (
            <motion.div
              key={`empty-${item}`}
              className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl border-4 border-dashed border-pink-200 flex items-center justify-center relative"
            >
               <div className="absolute inset-0 flex items-center justify-center text-3xl md:text-4xl opacity-20 filter grayscale blur-[1px]">{item}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Available Items */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 w-full max-w-3xl mb-8 min-h-[120px]">
        <AnimatePresence>
          {shuffled.map((item) => {
            const isPlaced = sequence.indexOf(item) < currentIndex;
            if (isPlaced) return null;

            return (
              <motion.button
                key={`avail-${item}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, rotate: [-5, 5, 0] }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemClick(item)}
                className="w-16 h-16 md:w-20 md:h-20 bg-[#f472b6] hover:bg-[#f9a8d4] rounded-2xl flex flex-col items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-[0_6px_0_0_#be185d] border-2 border-pink-400 cursor-pointer active:translate-y-2 active:shadow-none transition-colors"
              >
                 {item}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback & Controls */}
      <div className="h-24 flex flex-col items-center justify-center w-full mt-auto">
        <AnimatePresence mode="wait">
          {errorMsg ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-rose-600 font-bold text-xl md:text-2xl bg-rose-50 px-6 py-4 rounded-full border-2 border-rose-200 shadow-sm"
            >
              <XCircle className="w-8 h-8" /> {errorMsg}
            </motion.div>
          ) : isLevelDone ? (
            <motion.div 
              key="leveldone"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3 text-emerald-700 font-bold text-2xl md:text-3xl bg-emerald-50 px-8 py-4 rounded-full border-2 border-emerald-200 shadow-md"
            >
              <CheckCircle2 className="w-8 h-8" /> Great! Next Level...
            </motion.div>
          ) : isCompleted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 text-pink-700 font-bold text-2xl md:text-4xl bg-pink-100 px-12 py-6 rounded-[2rem] border-4 border-pink-300 shadow-lg">
                <Trophy className="w-12 h-12 text-yellow-500" /> GRAND CHAMPION!
              </div>
              {onComplete ? (
                 <Button 
                   size="lg" 
                   className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#be185d] active:translate-y-1 active:shadow-none transition-all"
                   onClick={onComplete}
                 >
                   Next Game <Play className="ml-2 w-6 h-6 fill-current" />
                 </Button>
              ) : (
                 <Button 
                   size="lg" 
                   className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#be185d] active:translate-y-1 active:shadow-none transition-all"
                   onClick={() => startLevel(1)}
                 >
                   Play Again <Play className="ml-2 w-6 h-6 fill-current" />
                 </Button>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}

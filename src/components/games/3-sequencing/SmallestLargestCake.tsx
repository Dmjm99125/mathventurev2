import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle } from 'lucide-react';

const SIZES = [1, 2, 3, 4];

const Cake = ({ size }: { size: number }) => {
  return (
    <div className="flex flex-col items-center drop-shadow-md pb-2">
      {/* Cherry on top */}
      <div className="text-3xl md:text-4xl z-10 -mb-2 relative drop-shadow-sm">
         🍒
      </div>
      {/* Layers */}
      {Array.from({ length: size }).map((_, i) => (
         <div 
            key={i} 
            className="w-20 h-6 md:w-24 md:h-8 bg-pink-400 rounded-lg border-2 border-pink-600 shadow-inner mt-1 relative overflow-hidden"
            style={{ zIndex: 5 - i }} // ensure correct stacking context if they overlap
         >
            {/* Frosting drips */}
            <div className="absolute top-0 left-2 w-4 h-3 bg-pink-200 rounded-b-full opacity-80"></div>
            <div className="absolute top-0 right-3 w-3 h-4 bg-pink-200 rounded-b-full opacity-80"></div>
            <div className="absolute top-0 left-8 w-5 h-2 bg-pink-200 rounded-b-full opacity-80"></div>
         </div>
      ))}
    </div>
  );
}

export function SmallestLargestCake({ onComplete }: { onComplete?: () => void }) {
  const [shuffled, setShuffled] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    startRound();
  }, []);

  const startRound = () => {
    let newShuffled = [...SIZES].sort(() => Math.random() - 0.5);
    while (JSON.stringify(newShuffled) === JSON.stringify(SIZES)) {
      newShuffled = [...SIZES].sort(() => Math.random() - 0.5);
    }
    setShuffled(newShuffled);
    setCurrentIndex(0);
    setErrorMsg('');
  };

  const handleCakeClick = (size: number) => {
    if (currentIndex >= SIZES.length) return;

    if (size === SIZES[currentIndex]) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setErrorMsg('');
      if (currentIndex + 1 === SIZES.length) {
        setScore(s => s + 1);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      // Wrong!
      setErrorMsg('❌ Oops! Piliin ang pinakamaliit na cake na susunod!');
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isCompleted = currentIndex === SIZES.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#ffe6f0] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-pink-200 shrink-0 min-h-[600px]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-pink-100 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-pink-700 uppercase tracking-wide flex items-center gap-2">
          🎂 Smallest to Biggest Cake
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700">Score: <span className="text-pink-600">{score}</span></div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-pink-300 text-pink-700 font-bold hover:bg-pink-50 rounded-xl" onClick={onComplete}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white/60 border-4 border-pink-300 rounded-3xl p-4 md:p-6 mb-8 shadow-sm text-center w-full max-w-2xl">
         <h3 className="text-xl md:text-3xl font-bold text-pink-800 drop-shadow-sm">
            Ayusin mula sa <span className="text-rose-500">PINAKAMALIIT</span> papuntang <span className="text-fuchsia-600">PINAKAMALAKI!</span>
         </h3>
      </div>

      {/* Target Area (Placed items) */}
      <div className="flex items-end justify-center gap-4 md:gap-8 mb-10 w-full max-w-3xl bg-white/40 p-6 rounded-[2rem] border-4 border-dashed border-pink-400 min-h-[200px]">
        <AnimatePresence>
          {/* Placed Cakes */}
          {SIZES.slice(0, currentIndex).map((size) => (
            <motion.div
              key={`placed-${size}`}
              layout
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="border-b-4 border-pink-200/50 pb-2 px-2"
            >
               <Cake size={size} />
            </motion.div>
          ))}
          {/* Empty Slots */}
          {SIZES.slice(currentIndex).map((size) => (
            <motion.div
              key={`empty-${size}`}
              className="w-24 h-28 md:w-28 md:h-32 bg-pink-50/50 rounded-xl border-4 border-dashed border-pink-300 flex items-center justify-center"
            >
               <div className="text-pink-300/60 font-bold text-sm tracking-widest">SLOT</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Available Items */}
      <div className="flex flex-wrap items-end justify-center gap-6 md:gap-10 w-full max-w-3xl mb-8 min-h-[160px]">
        <AnimatePresence>
          {shuffled.map((size) => {
            const isPlaced = SIZES.indexOf(size) < currentIndex;
            if (isPlaced) return null;

            return (
              <motion.button
                key={`avail-${size}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCakeClick(size)}
                className="bg-white/80 hover:bg-white p-4 rounded-3xl border-4 border-pink-300 shadow-[0_6px_0_0_#f9a8d4] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-end min-h-[140px]"
              >
                 <Cake size={size} />
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
          ) : isCompleted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 text-pink-700 font-bold text-2xl md:text-3xl bg-pink-50 px-8 py-4 rounded-full border-2 border-pink-200 shadow-md">
                <CheckCircle2 className="w-8 h-8" /> 🎉 Yummy! Correct order!
              </div>
              <Button 
                size="lg" 
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#ec4899] active:translate-y-1 active:shadow-none transition-all"
                onClick={startRound}
              >
                Play Again <Play className="ml-2 w-6 h-6 fill-current" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}

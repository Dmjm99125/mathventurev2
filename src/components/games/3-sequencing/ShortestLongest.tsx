import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle } from 'lucide-react';

const SIZES = [3, 5, 7, 9];

const Caterpillar = ({ size }: { size: number }) => {
  return (
    <div className="flex items-center drop-shadow-md">
      {/* Head */}
      <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-full relative z-10 shadow-inner border-2 border-emerald-800 flex flex-col items-center justify-center">
         <div className="absolute -top-3 text-lg drop-shadow-sm">👀</div>
         <div className="w-4 h-1 bg-emerald-800 rounded-full mt-2 opacity-50"></div>
      </div>
      {/* Body Segments */}
      {Array.from({ length: size - 1 }).map((_, i) => (
         <div 
            key={i} 
            className="w-10 h-10 md:w-12 md:h-12 rounded-full -ml-4 shadow-inner border-2 border-emerald-700" 
            style={{
               backgroundColor: i % 2 === 0 ? '#10b981' : '#34d399', // alternating light/dark green
               zIndex: 9 - i
            }}
         />
      ))}
    </div>
  );
}

export function ShortestLongest({ onComplete }: { onComplete?: () => void }) {
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

  const handleCaterpillarClick = (size: number) => {
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
      setErrorMsg('❌ Oops! Piliin ang pinakamaikling uod!');
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isCompleted = currentIndex === SIZES.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#dff5d8] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-green-200 shrink-0 min-h-[600px]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-green-100 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-green-700 uppercase tracking-wide flex items-center gap-2">
          🐛 Shortest to Longest
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700">Score: <span className="text-green-600">{score}</span></div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-green-300 text-green-700 font-bold hover:bg-green-50 rounded-xl" onClick={onComplete}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white/60 border-4 border-green-300 rounded-3xl p-4 md:p-6 mb-8 shadow-sm text-center w-full max-w-2xl">
         <h3 className="text-xl md:text-3xl font-bold text-green-800 drop-shadow-sm">
            Ayusin mula sa <span className="text-emerald-600">PINAKAMAIKLI</span> papuntang <span className="text-lime-600">PINAKAMAHABA!</span>
         </h3>
      </div>

      {/* Target Area (Placed items) */}
      <div className="flex flex-col items-start justify-center gap-4 mb-10 w-full max-w-2xl bg-white/40 p-6 rounded-[2rem] border-4 border-dashed border-green-400 min-h-[300px]">
        <AnimatePresence>
          {/* Placed Caterpillars */}
          {SIZES.slice(0, currentIndex).map((size) => (
            <motion.div
              key={`placed-${size}`}
              layout
              initial={{ opacity: 0, scale: 0.5, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-full border-b-2 border-green-200/50 pb-2"
            >
               <Caterpillar size={size} />
            </motion.div>
          ))}
          {/* Empty Slots */}
          {SIZES.slice(currentIndex).map((size) => (
            <motion.div
              key={`empty-${size}`}
              className="w-full h-12 md:h-14 bg-green-50/50 rounded-full border-4 border-dashed border-green-300 flex items-center px-4"
            >
               <div className="text-green-300/50 font-bold text-sm tracking-widest">SLOT</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Available Items */}
      <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl mb-8 min-h-[200px]">
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
                whileHover={{ scale: 1.05, x: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCaterpillarClick(size)}
                className="bg-white/80 hover:bg-white p-3 rounded-full border-4 border-green-300 shadow-[0_6px_0_0_#86efac] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                 <Caterpillar size={size} />
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
              <div className="flex items-center gap-3 text-emerald-700 font-bold text-2xl md:text-3xl bg-emerald-50 px-8 py-4 rounded-full border-2 border-emerald-200 shadow-md">
                <CheckCircle2 className="w-8 h-8" /> 🎉 Great job! Ang galing!
              </div>
              <Button 
                size="lg" 
                className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#16a34a] active:translate-y-1 active:shadow-none transition-all"
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

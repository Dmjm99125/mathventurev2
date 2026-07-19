import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle } from 'lucide-react';

const SEQUENCE = [1, 2, 3, 4, 5];

export function ArrangeNumbers({ onComplete }: { onComplete?: () => void }) {
  const [shuffled, setShuffled] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    startRound();
  }, []);

  const startRound = () => {
    setCurrentIndex(0);
    setErrorMsg('');
    // Shuffle logic, ensuring it's not already sorted if possible
    let newShuffled = [...SEQUENCE].sort(() => Math.random() - 0.5);
    while (JSON.stringify(newShuffled) === JSON.stringify(SEQUENCE) && SEQUENCE.length > 1) {
      newShuffled = [...SEQUENCE].sort(() => Math.random() - 0.5);
    }
    setShuffled(newShuffled);
  };

  const handleNumberClick = (num: number) => {
    if (currentIndex >= SEQUENCE.length) return;

    if (num === SEQUENCE[currentIndex]) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setErrorMsg('');
      if (currentIndex + 1 === SEQUENCE.length) {
        setScore(s => s + 1);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      // Wrong!
      setErrorMsg('❌ Oops! Try the next lowest number!');
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isCompleted = currentIndex === SEQUENCE.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-cyan-100 to-blue-200 p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-4 border-cyan-300 shrink-0">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-cyan-100 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-cyan-700 uppercase tracking-wide flex items-center gap-2">
          🔢 Arrange Numbers
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700">Score: <span className="text-cyan-600">{score}</span></div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-cyan-300 text-cyan-700 font-bold hover:bg-cyan-50 rounded-xl" onClick={onComplete}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <h3 className="text-xl md:text-3xl font-bold text-slate-800 mb-8 text-center drop-shadow-sm px-4">
        Ayusin ang mga numero mula sa <span className="text-blue-600">pinakamababa</span> papuntang <span className="text-purple-600">pinakamataas!</span>
      </h3>

      {/* Arranged Numbers Area (Target Slots) */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10 w-full max-w-3xl bg-white/40 p-4 md:p-8 rounded-[2rem] border-2 border-dashed border-cyan-400">
        <AnimatePresence>
          {/* Placed Numbers */}
          {SEQUENCE.slice(0, currentIndex).map((num) => (
            <motion.div
              key={`placed-${num}`}
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-b from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-[0_4px_0_0_#059669] border-2 border-emerald-300"
            >
              {num}
            </motion.div>
          ))}
          {/* Empty Slots */}
          {SEQUENCE.slice(currentIndex).map((num) => (
            <motion.div
              key={`empty-${num}`}
              className="w-14 h-14 md:w-20 md:h-20 bg-cyan-50/50 rounded-2xl border-4 border-dashed border-cyan-300/60 flex items-center justify-center"
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Available Numbers */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 w-full max-w-2xl min-h-[120px]">
        <AnimatePresence>
          {shuffled.map((num) => {
            const isPlaced = SEQUENCE.indexOf(num) < currentIndex;
            if (isPlaced) return null; // Hide the number from the pool if it's already placed

            return (
              <motion.button
                key={`avail-${num}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, rotate: [-5, 5, 0] }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNumberClick(num)}
                className="w-20 h-20 md:w-28 md:h-28 bg-white hover:bg-blue-50 border-4 border-blue-300 rounded-3xl flex items-center justify-center text-5xl md:text-6xl font-bold text-blue-600 shadow-[0_6px_0_0_#93c5fd] active:translate-y-2 active:shadow-none transition-colors"
              >
                {num}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback & Controls */}
      <div className="h-28 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {errorMsg ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
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
                <CheckCircle2 className="w-8 h-8" /> 🎉 Great job!
              </div>
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#2563eb] active:translate-y-1 active:shadow-none transition-all"
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
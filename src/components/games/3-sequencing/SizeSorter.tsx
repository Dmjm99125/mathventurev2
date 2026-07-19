import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Maximize2, Minimize2, Scaling } from 'lucide-react';

const SIZES = [50, 80, 110, 140, 170];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export function SizeSorter({ onComplete }: { onComplete?: () => void }) {
  const [shuffled, setShuffled] = useState<{size: number, color: string}[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'smallToBig' | 'bigToSmall'>('smallToBig');
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    startRound();
  }, []);

  const startRound = () => {
    const isSmallToBig = Math.random() > 0.5;
    setMode(isSmallToBig ? 'smallToBig' : 'bigToSmall');

    const newOrder = [...SIZES];
    if (!isSmallToBig) newOrder.reverse();
    setOrder(newOrder);

    // Map sizes to colors so the color stays consistent for each size
    const items = SIZES.map((size, i) => ({ size, color: COLORS[i] }));
    const newShuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffled(newShuffled);
    
    setCurrentIndex(0);
    setErrorMsg('');
  };

  const handleCircleClick = (size: number) => {
    if (currentIndex >= order.length) return;

    if (size === order[currentIndex]) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setErrorMsg('');
      if (currentIndex + 1 === order.length) {
        setScore(s => s + 1);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      // Wrong!
      setErrorMsg('❌ Oops! Try the correct size!');
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isCompleted = currentIndex === order.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#fff8dc] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-orange-200 shrink-0 min-h-[600px]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-orange-100 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-orange-600 uppercase tracking-wide flex items-center gap-2">
          🎈 Size Sorter
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700">Score: <span className="text-orange-500">{score}</span></div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-orange-300 text-orange-600 font-bold hover:bg-orange-50 rounded-xl" onClick={onComplete}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white border-4 border-orange-300 rounded-3xl p-6 mb-8 shadow-md text-center w-full max-w-2xl flex flex-col items-center gap-2">
         {mode === 'smallToBig' ? (
            <>
               <Scaling className="w-12 h-12 text-blue-500" />
               <h3 className="text-xl md:text-3xl font-bold text-slate-700">
                  Click from <span className="text-blue-500">SMALLEST</span> to <span className="text-red-500">BIGGEST</span>
               </h3>
            </>
         ) : (
            <>
               <Scaling className="w-12 h-12 text-red-500" />
               <h3 className="text-xl md:text-3xl font-bold text-slate-700">
                  Click from <span className="text-red-500">BIGGEST</span> to <span className="text-blue-500">SMALLEST</span>
               </h3>
            </>
         )}
      </div>

      {/* Target Area (Placed items) */}
      <div className="flex items-end justify-center gap-4 mb-10 w-full min-h-[180px]">
        <AnimatePresence mode="popLayout">
          {order.slice(0, currentIndex).map((size) => {
            const item = shuffled.find(i => i.size === size)!;
            return (
              <motion.div
                key={`placed-${size}`}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-full shadow-[0_8px_0_0_rgba(0,0,0,0.2)] border-4 border-white/50"
                style={{ 
                   width: size, 
                   height: size, 
                   backgroundColor: item.color,
                   backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)'
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Available Items */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-8 w-full max-w-3xl min-h-[200px]">
        <AnimatePresence>
          {shuffled.map((item) => {
            const isPlaced = order.indexOf(item.size) < currentIndex;
            if (isPlaced) return null; // Hide if already placed

            return (
              <motion.button
                key={`avail-${item.size}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCircleClick(item.size)}
                className="rounded-full shadow-[0_8px_0_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-none transition-all cursor-pointer border-4 border-white/50"
                style={{ 
                   width: item.size, 
                   height: item.size, 
                   backgroundColor: item.color,
                   backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)'
                }}
              />
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
                <CheckCircle2 className="w-8 h-8" /> 🎉 Great job!
              </div>
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#ea580c] active:translate-y-1 active:shadow-none transition-all"
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

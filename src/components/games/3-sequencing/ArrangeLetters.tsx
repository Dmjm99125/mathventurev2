import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, TrainFront } from 'lucide-react';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function ArrangeLetters({ onComplete }: { onComplete?: () => void }) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    startRound();
  }, []);

  const startRound = () => {
    const startIdx = Math.floor(Math.random() * (ALPHABET.length - 4));
    const newSeq = ALPHABET.slice(startIdx, startIdx + 4);
    setSequence(newSeq);
    
    let newShuffled = [...newSeq].sort(() => Math.random() - 0.5);
    while (JSON.stringify(newShuffled) === JSON.stringify(newSeq) && newSeq.length > 1) {
      newShuffled = [...newSeq].sort(() => Math.random() - 0.5);
    }
    
    setShuffled(newShuffled);
    setCurrentIndex(0);
    setErrorMsg('');
  };

  const handleLetterClick = (letter: string) => {
    if (currentIndex >= sequence.length) return;

    if (letter === sequence[currentIndex]) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setErrorMsg('');
      if (currentIndex + 1 === sequence.length) {
        setScore(s => s + 1);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      // Wrong!
      setErrorMsg(`❌ Hindi yan! Subukan ang ${sequence[currentIndex]} 🤔`);
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isCompleted = currentIndex === sequence.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#b6d8e3] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-white shrink-0">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-cyan-100 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-cyan-800 uppercase tracking-wide flex items-center gap-2">
          <TrainFront className="w-8 h-8 text-cyan-600" /> Alphabet Express
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

      {/* Prompt / Engine Message */}
      <div className="bg-[#ffd58c] border-4 border-[#c1863d] rounded-2xl p-4 mb-6 shadow-md text-center max-w-md w-full">
         <h3 className="text-lg md:text-xl font-bold text-amber-900 drop-shadow-sm flex items-center justify-center gap-2">
            ❤️ KAYA MO YAN!
         </h3>
         <p className="text-amber-800 font-bold mt-2 tracking-[0.3em] text-xl bg-[#bee0b9] border-2 border-[#57944e] rounded-xl py-1 inline-block px-4">
            {sequence.join(" ")}
         </p>
         <p className="text-amber-900 font-bold mt-3 text-lg">Pagsunod-sunurin ang mga letra!</p>
      </div>

      {/* Train Cars Area (Target Slots) */}
      <div className="flex justify-center items-end gap-2 md:gap-4 mb-10 w-full max-w-3xl bg-[#b8d198] p-4 md:p-6 rounded-3xl border-4 border-[#789b4b] shadow-inner relative">
        <AnimatePresence>
          {/* Train Engine Decor */}
          <div className="hidden md:flex flex-col items-center justify-center bg-[#ea9549] rounded-t-2xl rounded-b-md w-24 h-32 border-4 border-[#ad6e35] shadow-[0_4px_0_0_#7b4f26]">
             <TrainFront className="w-16 h-16 text-amber-900" />
             <div className="flex gap-2 mt-2">
                <div className="w-6 h-6 bg-slate-800 rounded-full border-2 border-slate-600"></div>
                <div className="w-6 h-6 bg-slate-800 rounded-full border-2 border-slate-600"></div>
             </div>
          </div>

          {/* Placed Letters */}
          {sequence.slice(0, currentIndex).map((letter) => (
            <motion.div
              key={`placed-${letter}`}
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-16 h-20 md:w-20 md:h-28 bg-[#ffc88a] rounded-t-2xl rounded-b-md flex flex-col items-center justify-between py-2 text-3xl md:text-5xl font-bold text-[#2c1809] shadow-[0_4px_0_0_#7b4f26] border-4 border-[#ad6e35] relative"
            >
              <div className="text-[10px] md:text-xs opacity-60">😊</div>
              <div className="flex-1 flex items-center">{letter}</div>
              <div className="flex gap-2 mt-1">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-800 rounded-full border-2 border-slate-600"></div>
                <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-800 rounded-full border-2 border-slate-600"></div>
              </div>
            </motion.div>
          ))}
          {/* Empty Slots */}
          {sequence.slice(currentIndex).map((letter, idx) => (
            <motion.div
              key={`empty-${letter}`}
              className="w-16 h-20 md:w-20 md:h-28 bg-[#e8b57d]/40 rounded-t-2xl rounded-b-md border-4 border-dashed border-[#ad6e35]/50 flex flex-col items-center justify-between py-2"
            >
               <div className="text-[10px] md:text-xs opacity-40">😊</div>
               <div className="flex gap-2 mt-auto">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-800/30 rounded-full border-2 border-slate-600/30"></div>
                <div className="w-4 h-4 md:w-5 md:h-5 bg-slate-800/30 rounded-full border-2 border-slate-600/30"></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Available Letters Station */}
      <div className="bg-[#cfdbea] border-4 border-[#6482a3] rounded-3xl p-6 w-full max-w-2xl mb-8 shadow-md">
         <div className="flex flex-wrap justify-center gap-4 md:gap-6 min-h-[100px]">
            <AnimatePresence>
            {shuffled.map((letter) => {
               const isPlaced = sequence.indexOf(letter) < currentIndex;
               if (isPlaced) return null; // Hide if placed

               return (
                  <motion.button
                  key={`avail-${letter}`}
                  layout
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: 1.1, rotate: [-5, 5, 0] }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLetterClick(letter)}
                  className="w-16 h-20 md:w-20 md:h-24 bg-[#ffdbb5] hover:bg-[#ffeac9] border-4 border-[#ea9549] rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold text-[#7a4115] shadow-[0_6px_0_0_#b15f2a] active:translate-y-2 active:shadow-none transition-colors"
                  >
                  {letter}
                  </motion.button>
               );
            })}
            </AnimatePresence>
         </div>
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
                <CheckCircle2 className="w-8 h-8" /> 🏆 Mahusay! Magaling, binabati kita!
              </div>
              <Button 
                size="lg" 
                className="bg-[#fdd06b] hover:bg-[#f6c24d] text-amber-900 border-4 border-[#cc8b3c] font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#9e632b] active:translate-y-1 active:shadow-none transition-all"
                onClick={startRound}
              >
                NEXT TRAIN ➔
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="prompt"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-[#ead2aa] px-8 py-3 rounded-xl border-4 border-[#c1863d] text-[#7a4115] font-bold text-xl md:text-2xl shadow-sm"
            >
              Pumili ng mga letra.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

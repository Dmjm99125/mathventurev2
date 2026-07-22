import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Puzzle, Trophy } from 'lucide-react';

const LIBRARY = [
    { char: "🐟", parts: 3, name: "The Shiny Fish! 🐟", color: "#e0f2fe" },
    { char: "🐳", parts: 3, name: "The Blue Whale! 🐳", color: "#e0f2fe" },
    { char: "🚀", parts: 3, name: "The Space Rocket! 🚀", color: "#fef3c7" },
    { char: "🐛", parts: 4, name: "The Hungry Caterpillar! 🐛", color: "#dcfce7" },
    { char: "🚂", parts: 4, name: "The Choo-Choo Train! 🚂", color: "#fee2e2" },
    { char: "🦖", parts: 4, name: "The Green Dinosaur! 🦖", color: "#dcfce7" },
    { char: "🐊", parts: 5, name: "The Snappy Crocodile! 🐊", color: "#dcfce7" },
    { char: "🐉", parts: 5, name: "The Magic Dragon! 🐉", color: "#f3e8ff" },
    { char: "🚌", parts: 5, name: "The School Bus! 🚌", color: "#fef3c7" },
    { char: "🐍", parts: 6, name: "The Long, Long Snake! 🐍", color: "#ecfdf5" }
];

const EmojiPiece = ({ char, parts, orderIndex, isMerged }: { char: string, parts: number, orderIndex: number, isMerged?: boolean }) => {
    const start = (orderIndex / parts) * 100;
    const end = ((orderIndex + 1) / parts) * 100;
    
    return (
      <div 
         className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isMerged 
            ? 'w-[4.5rem] h-[5rem] md:w-[5.5rem] md:h-[6rem] bg-transparent' // seamless merge
            : 'w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-[0_4px_0_0_#cbd5e1] border-2 border-slate-200'
         }`}
      >
          <div 
              className="absolute flex items-center justify-center leading-none select-none h-full"
              style={{
                  clipPath: `inset(0 ${100 - end}% 0 ${start}%)`,
                  width: `${parts * 100}%`,
                  transform: `translateX(${((parts - 1) / 2 - orderIndex) * (100 / parts)}%)`
              }}
          >
              <span style={{ 
                  transform: `scaleX(${parts})`, 
                  fontSize: isMerged ? '5rem' : '4rem', 
                  display: 'inline-block' 
              }}>
                  {char}
              </span>
          </div>
      </div>
    );
};

export function AnimalVehicleBuilder({ onComplete }: { onComplete?: () => void }) {
  const [level, setLevel] = useState(1);
  const [selectedLevels, setSelectedLevels] = useState<typeof LIBRARY>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<typeof LIBRARY[0] | null>(null);
  
  const [shuffled, setShuffled] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMerged, setIsMerged] = useState(false);

  useEffect(() => {
    setupGame();
  }, []);

  const setupGame = () => {
    const shuffledLib = [...LIBRARY].sort(() => Math.random() - 0.5);
    const selected = shuffledLib.slice(0, 5).sort((a, b) => a.parts - b.parts);
    setSelectedLevels(selected);
    startLevel(1, selected);
  };

  const startLevel = (lvlNum: number, levels: typeof LIBRARY) => {
    setLevel(lvlNum);
    const puzzle = levels[lvlNum - 1];
    setCurrentPuzzle(puzzle);
    setCurrentIndex(0);
    setErrorMsg('');
    setIsMerged(false);

    let pieces = Array.from({ length: puzzle.parts }, (_, i) => i);
    let newShuffled = [...pieces].sort(() => Math.random() - 0.5);
    while (JSON.stringify(newShuffled) === JSON.stringify(pieces) && pieces.length > 1) {
      newShuffled = [...pieces].sort(() => Math.random() - 0.5);
    }
    
    setShuffled(newShuffled);
  };

  const handlePieceClick = (orderIndex: number) => {
    if (!currentPuzzle || isMerged) return;

    if (orderIndex === currentIndex) {
      // Correct!
      setCurrentIndex(prev => prev + 1);
      setErrorMsg('');
      
      if (currentIndex + 1 === currentPuzzle.parts) {
        setIsMerged(true);
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        
        if (level < 5) {
           setTimeout(() => startLevel(level + 1, selectedLevels), 2500);
        }
      }
    } else {
      // Wrong!
      setErrorMsg(`❌ Oops! Find the next piece!`);
      setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const isLevelDone = isMerged && level < 5;
  const isCompleted = isMerged && level === 5;

  if (!currentPuzzle) return null;

  return (
    <div 
      className="w-full max-w-4xl mx-auto p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 shrink-0 min-h-[600px] transition-colors duration-500"
      style={{ backgroundColor: currentPuzzle.color, borderColor: 'rgba(255,255,255,0.6)' }}
    >
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/60 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-white/80 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold font-display text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <Puzzle className="w-8 h-8 text-sky-500" /> Mega Builder
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-slate-700 bg-white/80 px-4 py-1 rounded-full shadow-sm">
             Puzzle: <span className="text-sky-600">{level}/5</span>
          </div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-sky-300 text-sky-700 font-bold hover:bg-sky-50 rounded-xl bg-white" onClick={onComplete}>
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-white/80 border-4 border-white/90 rounded-3xl p-4 md:p-6 mb-8 shadow-sm text-center w-full max-w-2xl">
         <h3 className="text-2xl md:text-4xl font-bold text-slate-800 drop-shadow-sm mb-2">
            {currentPuzzle.name}
         </h3>
         <p className="text-slate-500 font-medium">Tap the pieces in order to build it!</p>
      </div>

      {/* Target Area (Placed items) */}
      <motion.div 
         className={`flex items-center justify-center mb-10 w-full max-w-3xl p-6 rounded-[2rem] min-h-[160px] transition-all duration-500 ${
            isMerged ? 'bg-white/90 shadow-2xl scale-105 border-0' : 'bg-white/40 border-4 border-dashed border-slate-300/50'
         }`}
         animate={isMerged ? { rotate: [-2, 2, -2, 2, 0], scale: [1, 1.05, 1] } : {}}
         transition={{ duration: 0.5 }}
      >
        <AnimatePresence>
          {/* Placed Items */}
          <div className="flex items-center">
             {Array.from({ length: currentPuzzle.parts }).map((_, i) => {
                const isPlaced = i < currentIndex;
                
                if (isPlaced) {
                   return (
                      <motion.div
                        key={`placed-${i}`}
                        layout
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className={isMerged ? '-mx-[2px]' : 'mx-1'} // pull together tightly when merged
                      >
                         <EmojiPiece char={currentPuzzle.char} parts={currentPuzzle.parts} orderIndex={i} isMerged={isMerged} />
                      </motion.div>
                   );
                } else {
                   // Empty Slot
                   return (
                     <div
                        key={`empty-${i}`}
                        className="w-16 h-16 md:w-20 md:h-20 bg-white/40 rounded-xl border-4 border-dashed border-slate-300/50 mx-1 flex items-center justify-center transition-colors"
                     />
                   );
                }
             })}
          </div>
        </AnimatePresence>
      </motion.div>

      {/* Available Items */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 w-full max-w-3xl mb-8 min-h-[120px]">
        <AnimatePresence>
          {shuffled.map((orderIndex) => {
            const isPlaced = orderIndex < currentIndex;
            if (isPlaced) return null;

            return (
              <motion.button
                key={`avail-${orderIndex}`}
                layout
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePieceClick(orderIndex)}
                className="cursor-pointer active:translate-y-1 transition-transform"
              >
                 <EmojiPiece char={currentPuzzle.char} parts={currentPuzzle.parts} orderIndex={orderIndex} />
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
              className="flex items-center gap-3 text-sky-700 font-bold text-2xl md:text-3xl bg-sky-50 px-8 py-4 rounded-full border-2 border-sky-200 shadow-md"
            >
              <CheckCircle2 className="w-8 h-8" /> Amazing! Next Puzzle...
            </motion.div>
          ) : isCompleted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 text-sky-700 font-bold text-2xl md:text-4xl bg-white px-12 py-6 rounded-[2rem] border-4 border-sky-200 shadow-xl">
                <Trophy className="w-12 h-12 text-yellow-500" /> MASTER PUZZLE BUILDER!
              </div>
              {onComplete ? (
                 <Button 
                   size="lg" 
                   className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#0284c7] active:translate-y-1 active:shadow-none transition-all"
                   onClick={onComplete}
                 >
                   Next Game <Play className="ml-2 w-6 h-6 fill-current" />
                 </Button>
              ) : (
                 <Button 
                   size="lg" 
                   className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#0284c7] active:translate-y-1 active:shadow-none transition-all"
                   onClick={setupGame}
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

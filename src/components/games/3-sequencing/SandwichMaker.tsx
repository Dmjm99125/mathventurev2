import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Sandwich, Trophy } from 'lucide-react';

const METADATA = {
    bread: { emoji: '🍞', style: 'bg-[#FFE082] border-[#FFB300]', name: 'Bread' },
    ham: { emoji: '🍖', style: 'bg-[#FFCDD2] border-[#E57373]', name: 'Ham' },
    cheese: { emoji: '🧀', style: 'bg-[#FFF59D] border-[#FBC02D]', name: 'Cheese' },
    lettuce: { emoji: '🥬', style: 'bg-[#C8E6C9] border-[#81C784]', name: 'Lettuce' },
    tomato: { emoji: '🍅', style: 'bg-[#FFCCBC] border-[#FF5722]', name: 'Tomato' },
    egg: { emoji: '🍳', style: 'bg-[#F5F5F5] border-[#BDBDBD]', name: 'Egg' }
};

type ItemType = keyof typeof METADATA;
const FILLINGS: ItemType[] = ['ham', 'cheese', 'lettuce', 'tomato', 'egg'];

const getRandomFilling = () => FILLINGS[Math.floor(Math.random() * FILLINGS.length)];

export function SandwichMaker({ onComplete }: { onComplete?: () => void }) {
  const [level, setLevel] = useState(1);
  const [activePattern, setActivePattern] = useState<ItemType[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    startLevel(1);
  }, []);

  const startLevel = (lvl: number) => {
    setLevel(lvl);
    setCurrentStep(0);
    setErrorMsg('');

    let pattern: ItemType[] = [];
    if (lvl === 1) {
        pattern = ['bread', getRandomFilling(), 'bread'];
    } else if (lvl === 2) {
        let f1 = getRandomFilling();
        let f2 = getRandomFilling();
        while(f1 === f2) { f2 = getRandomFilling(); }
        pattern = ['bread', f1, f2, 'bread'];
    } else {
        let f1 = getRandomFilling();
        let f2 = getRandomFilling();
        let f3 = getRandomFilling();
        pattern = ['bread', f1, 'bread', f2, f3, 'bread'];
    }
    setActivePattern(pattern);
  };

  const handleIngredientClick = (type: ItemType) => {
    if (currentStep >= activePattern.length) return;

    if (type === activePattern[currentStep]) {
        // Correct!
        setCurrentStep(prev => prev + 1);
        setErrorMsg('');
        
        if (currentStep + 1 === activePattern.length) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    } else {
        // Wrong!
        setErrorMsg('❌ Oops! Check the recipe!');
        setTimeout(() => setErrorMsg(''), 2000);
    }
  };

  const getInstructionText = () => {
      if (level === 1) return "Let's build a simple 3-step mini sandwich!";
      if (level === 2) return "Great! Try this 4-step sequence!";
      return "Ultimate Challenge: Make a massive 6-layer Club Sandwich!";
  };

  const isLevelDone = currentStep === activePattern.length && level < 3;
  const isCompleted = currentStep === activePattern.length && level === 3;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#FFFDE7] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-amber-200 shrink-0 min-h-[600px] overflow-hidden">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-amber-100 flex-wrap gap-4 z-10">
        <h2 className="text-xl md:text-2xl font-bold font-display text-amber-700 uppercase tracking-wide flex items-center gap-2">
          <Sandwich className="w-8 h-8 text-amber-500" /> Sandwich Maker
        </h2>
        <div className="flex gap-4 items-center">
          <div className="text-lg md:text-xl font-bold text-white bg-amber-500 px-5 py-1.5 rounded-full shadow-sm shadow-amber-600">
             Level: {level}
          </div>
          {onComplete && (
            <Button variant="outline" className="border-2 border-amber-400 text-amber-700 font-bold hover:bg-amber-50 rounded-xl bg-white" onClick={onComplete}>
              Finish Module ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="text-center mb-4">
         <h3 className="text-lg md:text-xl font-bold text-[#5D4037]">{getInstructionText()}</h3>
      </div>

      {/* Recipe Guide */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-white border-4 border-dashed border-amber-400 p-4 rounded-3xl mb-8 w-full max-w-2xl shadow-sm">
         <span className="font-bold text-amber-600 uppercase mr-2 text-sm md:text-base">Recipe Target:</span>
         {activePattern.map((item, idx) => (
             <div key={`recipe-${idx}`} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl text-xl md:text-2xl border-2 shadow-sm relative ${METADATA[item].style}`}>
                 {METADATA[item].emoji}
                 {idx < currentStep && (
                     <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                         ✓
                     </div>
                 )}
             </div>
         ))}
      </div>

      {/* Game Board */}
      <div className="flex flex-col md:flex-row w-full max-w-3xl gap-6 z-10">
          
          {/* Pantry */}
          <div className="flex-1 bg-white border-4 border-emerald-500 p-4 md:p-6 rounded-[2rem] shadow-md flex flex-col items-center">
              <h3 className="text-emerald-700 font-bold text-lg mb-4">Pick Items</h3>
              <div className="grid grid-cols-2 gap-3 w-full">
                  {(Object.keys(METADATA) as ItemType[]).map((type) => (
                      <motion.button
                         key={type}
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => handleIngredientClick(type)}
                         className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:translate-y-1 active:shadow-none transition-all ${METADATA[type].style}`}
                      >
                         <span className="text-4xl drop-shadow-sm">{METADATA[type].emoji}</span>
                         <span className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wide">{METADATA[type].name}</span>
                      </motion.button>
                  ))}
              </div>
          </div>

          {/* Plate */}
          <div className="flex-1 bg-white border-4 border-emerald-500 p-4 md:p-6 rounded-[2rem] shadow-md flex flex-col items-center justify-end min-h-[250px]">
              <h3 className="text-emerald-700 font-bold text-lg mb-auto">Your Plate</h3>
              
              <div className="w-40 h-40 md:w-48 md:h-48 bg-cyan-50 border-8 border-cyan-500 rounded-full flex flex-col-reverse items-center pb-4 mt-6 relative shadow-inner">
                 <AnimatePresence>
                    {activePattern.slice(0, currentStep).map((item, idx) => (
                        <motion.div
                           key={`plate-${idx}`}
                           initial={{ opacity: 0, y: -100 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ type: 'spring', bounce: 0.4 }}
                           className={`w-28 h-6 md:w-32 md:h-7 rounded-[50px/10px] -mb-2 flex items-center justify-center shadow-sm border-2 ${METADATA[item].style}`}
                           style={{ zIndex: activePattern.length - idx }}
                        >
                           {/* Just show a faint emoji inside the layer for flavor */}
                           <span className="text-xs md:text-sm opacity-50 select-none pointer-events-none">{METADATA[item].emoji} {METADATA[item].emoji}</span>
                        </motion.div>
                    ))}
                 </AnimatePresence>
              </div>
          </div>
      </div>

      {/* Feedback & Controls */}
      <div className="h-24 flex flex-col items-center justify-center w-full mt-auto z-20">
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
              className="flex items-center gap-3 text-amber-700 font-bold text-xl md:text-2xl bg-amber-50 px-8 py-4 rounded-full border-2 border-amber-400 shadow-md"
            >
              <CheckCircle2 className="w-8 h-8" /> Tasty! Next Recipe...
              <Button onClick={() => startLevel(level + 1)} className="ml-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full">Next</Button>
            </motion.div>
          ) : isCompleted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 fixed inset-0 bg-amber-900/90 z-50 justify-center p-4 text-center"
            >
              <div className="text-7xl animate-bounce">⭐🌟⭐</div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md">Master Chef Status! 👑🏆</h1>
              <p className="text-xl md:text-2xl text-amber-200 font-medium mb-4">You built the Giant Double-Decker Club Sandwich!</p>
              
              <Button 
                   size="lg" 
                   className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all"
                   onClick={() => startLevel(1)}
                 >
                   Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                 </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}

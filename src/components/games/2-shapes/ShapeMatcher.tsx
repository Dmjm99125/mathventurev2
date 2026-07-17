import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';

const ITEMS = [
    { id: "dice", emoji: "🎲", match: "cube" },
    { id: "drum", emoji: "🥁", match: "cylinder" },
    { id: "ball", emoji: "🏀", match: "sphere" },
    { id: "cone", emoji: "🍦", match: "cone" },
    { id: "earth", emoji: "🌍", match: "sphere" }
];

const TARGETS = [
    { shape: "cube", name: "CUBE", icon: "🟩" },
    { shape: "cone", name: "CONE", icon: "📐" },
    { shape: "cylinder", name: "CYLINDER", icon: "🏮" },
    { shape: "sphere", name: "SPHERE", icon: "🔵" }
];

export function ShapeMatcher({ onComplete }: { onComplete?: () => void }) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [shuffledItems, setShuffledItems] = useState(ITEMS);
  const [shuffledTargets, setShuffledTargets] = useState(TARGETS);
  
  const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setMatches({});
    setMessage('');
    setShuffledItems([...ITEMS].sort(() => Math.random() - 0.5));
    setShuffledTargets([...TARGETS].sort(() => Math.random() - 0.5));
  };

  const handleDragEnd = (event: any, info: any, item: typeof ITEMS[0]) => {
    let droppedShape = null;
    for (const [shape, ref] of Object.entries(targetRefs.current)) {
      if (!ref) continue;
      const rect = ref.getBoundingClientRect();
      const pad = 30; // generous padding for kids
      if (
        info.point.x >= rect.left - pad &&
        info.point.x <= rect.right + pad &&
        info.point.y >= rect.top - pad &&
        info.point.y <= rect.bottom + pad
      ) {
        droppedShape = shape;
        break;
      }
    }

    if (droppedShape) {
      if (droppedShape === item.match) {
        setMatches(prev => {
          const next = { ...prev, [item.id]: droppedShape };
          if (Object.keys(next).length === ITEMS.length) {
            setMessage("HOORAY! You matched them all! 🎉");
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          } else {
            setMessage("Correct! 🌟");
          }
          return next;
        });
      } else {
        setMessage("Try another one! ❌");
        setTimeout(() => {
           setMessage(prev => prev === "Try another one! ❌" ? "" : prev);
        }, 1500);
      }
    }
  };

  const isWon = Object.keys(matches).length === ITEMS.length;

  return (
    <div className="w-full max-w-5xl mx-auto bg-[#fdf5e6] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative overflow-hidden shrink-0 h-fit min-h-[600px] border-4 border-[#ffd8a8]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 flex-wrap gap-4 bg-white/60 p-5 rounded-3xl shadow-sm border border-orange-100">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[#ff4500] drop-shadow-sm mb-1 tracking-wide">Shape Matcher!</h1>
          <p className="text-lg text-gray-700 font-bold">Drag the toy to the matching shape box!</p>
        </div>
        {onComplete && (
          <Button 
            variant="outline" 
            className="border-2 border-orange-300 text-orange-700 font-bold hover:bg-orange-100 rounded-xl bg-white shadow-sm"
            onClick={onComplete}
          >
            Next Game ➡️
          </Button>
        )}
      </div>

      {/* Message Area */}
      <div className="h-12 mb-4 flex items-center justify-center w-full">
        <p className={`text-2xl md:text-3xl font-bold transition-all ${isWon ? 'text-green-600 scale-110 drop-shadow-sm' : message.includes('❌') ? 'text-red-500 animate-bounce' : 'text-green-500'}`}>
          {message}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-start flex-1 mb-8 px-2 md:px-8 z-10">
        
        {/* Draggable Items Column */}
        <div className="flex flex-row flex-wrap md:flex-col gap-4 justify-center items-center w-full md:w-32 bg-white/50 p-4 rounded-3xl border-2 border-[#ffcc80] shadow-sm min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {shuffledItems.map(item => !matches[item.id] && (
              <motion.div
                key={item.id}
                layoutId={`item-${item.id}`}
                drag
                dragSnapToOrigin={true}
                onDragEnd={(e, info) => handleDragEnd(e, info, item)}
                whileDrag={{ scale: 1.2, zIndex: 50, rotate: -10 }}
                className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-[#4da6ff] rounded-[2rem] flex justify-center items-center text-5xl md:text-6xl cursor-grab active:cursor-grabbing shadow-[0_6px_0_0_#3388dd] active:shadow-none active:translate-y-1 touch-none"
              >
                {item.emoji}
              </motion.div>
            ))}
            {Object.keys(matches).length === ITEMS.length && (
               <div className="text-green-600 font-bold text-center w-full my-4">All done! ✨</div>
            )}
          </AnimatePresence>
        </div>

        {/* Targets Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg">
          {shuffledTargets.map(target => {
            const hasMatches = Object.values(matches).includes(target.shape);
            
            return (
              <div
                key={target.shape}
                ref={el => { targetRefs.current[target.shape] = el; }}
                className={`flex flex-col items-center p-4 min-h-[160px] md:min-h-[180px] border-4 border-dashed rounded-3xl transition-colors duration-300 relative
                  ${hasMatches ? 'bg-[#bfffbf] border-[#008000] border-solid shadow-inner' : 'bg-[#fff9ef] border-[#ff9900]'}`}
              >
                <div className="text-xl md:text-2xl font-bold text-[#d2691e] mb-2 z-0 uppercase tracking-widest">{target.name}</div>
                {hasMatches ? null : <div className="text-5xl md:text-6xl z-0 mb-4 opacity-40">{target.icon}</div>}
                
                {/* Matched Items Container */}
                <div className="flex-1 flex items-center justify-center gap-2 flex-wrap w-full z-10">
                  {shuffledItems.filter(item => matches[item.id] === target.shape).map(item => (
                    <motion.div
                      key={item.id}
                      layoutId={`item-${item.id}`}
                      className="text-5xl md:text-6xl drop-shadow-md"
                    >
                      {item.emoji}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isWon && (
        <Button 
          size="lg"
          className="bg-[#ff4500] hover:bg-[#cc3700] text-white font-bold text-2xl py-8 px-12 rounded-full shadow-[0_6px_0_0_#a02d00] animate-in slide-in-from-bottom-8 mb-4 active:translate-y-2 active:shadow-none transition-all"
          onClick={resetGame}
        >
          Play Again! 🔄
        </Button>
      )}

    </div>
  );
}

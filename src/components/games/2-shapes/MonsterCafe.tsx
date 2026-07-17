import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { motion, PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';

const ITEMS = [
    { id: 1, name: "clock", emoji: "🕒", shape: "circle" },
    { id: 2, name: "ball", emoji: "⚽", shape: "circle" },
    { id: 3, name: "window", emoji: "🪟", shape: "square" },
    { id: 4, name: "box", emoji: "📦", shape: "square" },
    { id: 5, name: "triangle", emoji: "🔺", shape: "triangle" },
    { id: 6, name: "tent", emoji: "⛺", shape: "triangle" },
    { id: 7, name: "star", emoji: "⭐", shape: "star" },
    { id: 8, name: "sparkle", emoji: "🌟", shape: "star" }
];

const SHAPES = ["circle", "square", "triangle", "star"];
const SHAPE_EMOJI: Record<string, string> = {
    circle: "⚪",
    square: "🟦",
    triangle: "🔺",
    star: "⭐"
};

export function MonsterCafe({ onComplete }: { onComplete?: () => void }) {
  const [currentShape, setCurrentShape] = useState('circle');
  const [choices, setChoices] = useState<typeof ITEMS>([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing'|'correct'|'wrong'>('playing');
  const [roundId, setRoundId] = useState(0); // to force remount of items
  
  const mouthRef = useRef<HTMLDivElement>(null);

  const startRound = () => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setCurrentShape(shape);
    
    const correctItems = ITEMS.filter(i => i.shape === shape);
    const correctItem = correctItems[Math.floor(Math.random() * correctItems.length)];
    
    const wrongItems = ITEMS.filter(i => i.shape !== shape)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    setChoices([correctItem, ...wrongItems].sort(() => Math.random() - 0.5));
    setGameState('playing');
    setRoundId(prev => prev + 1);
  };

  useEffect(() => {
    startRound();
  }, []);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, item: typeof ITEMS[0]) => {
    if (gameState !== 'playing') return;

    if (!mouthRef.current) return;
    const mouthRect = mouthRef.current.getBoundingClientRect();
    
    // info.point contains x and y relative to the viewport for the pointer
    const x = info.point.x;
    const y = info.point.y;
    
    // Add padding to make it easier for kids to hit the target
    const pad = 30;
    const isOverMouth = 
      x >= mouthRect.left - pad &&
      x <= mouthRect.right + pad &&
      y >= mouthRect.top - pad &&
      y <= mouthRect.bottom + pad;

    if (isOverMouth) {
      if (item.shape === currentShape) {
        setGameState('correct');
        setScore(s => s + 1);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        setGameState('wrong');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#3b2b22] p-4 md:p-6 rounded-[3rem] shadow-2xl flex flex-col items-center relative overflow-hidden shrink-0 h-fit">
      
      {/* Game Card Container */}
      <div className="w-full bg-[#fdeacb] p-4 md:p-6 rounded-[2rem] flex flex-col items-center flex-1 h-full shadow-inner relative mt-4 md:mt-0">
        
        {/* Top Header Row */}
        <div className="w-full flex justify-between items-center mb-4 flex-wrap gap-4">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-orange-800">👾 Monster Cafe</h2>
          
          <div className="flex items-center gap-4">
            <div className="text-lg md:text-xl font-bold text-gray-700 bg-white/60 px-4 py-2 rounded-full shadow-sm border border-orange-200">
               Score: <span className="text-orange-600">{score}</span>
            </div>
            {onComplete && (
              <Button 
                variant="outline" 
                className="bg-white/80 border-2 border-orange-300 text-orange-800 font-bold hover:bg-orange-100 flex rounded-xl"
                onClick={onComplete}
              >
                Next Game ➡️
              </Button>
            )}
          </div>
        </div>

        <p className="text-lg md:text-xl font-bold text-gray-800 flex items-center justify-center gap-3 mb-6 bg-orange-100 px-6 py-3 rounded-2xl border-2 border-orange-200 shadow-sm w-full md:w-auto text-center flex-col sm:flex-row">
          <span className="text-5xl">{SHAPE_EMOJI[currentShape]}</span> 
          <span>Feed me this shape!</span>
        </p>

        {/* Monster */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="text-[5rem] mb-2 animate-bounce">👀</div>
          <div 
            ref={mouthRef}
            className={`w-36 h-20 rounded-b-[5rem] transition-colors duration-300 shadow-inner relative flex items-center justify-center
              ${gameState === 'correct' ? 'bg-green-400' : gameState === 'wrong' ? 'bg-red-400' : 'bg-black'}`}
          >
            {gameState === 'wrong' && <span className="text-4xl">😢</span>}
            {gameState === 'correct' && <span className="text-4xl">😋</span>}
          </div>
          
          <div className={`mt-4 text-2xl font-bold transition-all ${gameState === 'playing' ? 'text-orange-900/60' : gameState === 'correct' ? 'text-green-600 scale-110' : 'text-red-600 scale-110'}`}>
            {gameState === 'playing' ? 'Drag item to mouth' : gameState === 'correct' ? 'YUM! 😋' : 'Oops! 😢'}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4 w-full px-2 md:px-6 z-10" key={roundId}>
          {choices.map((item, idx) => (
            <motion.div
              key={`${roundId}-${idx}`}
              drag
              dragSnapToOrigin={true}
              onDragEnd={(e, info) => handleDragEnd(e, info, item)}
              whileDrag={{ scale: 1.15, zIndex: 50, rotate: -5 }}
              className={`bg-[#fee1b5] border-b-4 border-[#e6b87c] p-4 rounded-2xl flex flex-col items-center cursor-grab active:cursor-grabbing touch-none
                ${gameState !== 'playing' ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-1'}`}
            >
              <span className="text-[4rem] mb-2 pointer-events-none drop-shadow-sm">{item.emoji}</span>
              <span className="font-bold text-orange-900 capitalize pointer-events-none">{item.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Next Round */}
        <div className="h-20 flex items-center justify-center mt-6 w-full">
          {gameState !== 'playing' && (
            <Button
              size="lg"
              className={`w-full font-bold text-xl py-8 rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-4 active:translate-y-1 active:shadow-none transition-all ${
                  gameState === 'correct' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              onClick={startRound}
            >
              {gameState === 'correct' ? 'Next Customer' : 'Try Again'}
            </Button>
          )}
        </div>

      </div>

    </div>
  );
}

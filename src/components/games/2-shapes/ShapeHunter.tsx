import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const SHAPES = ["Circle", "Square", "Rectangle", "Triangle", "Star"];
const REWARDS = ["🎈", "🐰", "🦄", "🐶", "⭐", "🎁", "🐱", "🌈"];

export function ShapeHunter({ onComplete }: { onComplete?: () => void }) {
  const [targetShape, setTargetShape] = useState('');
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [earnedRewards, setEarnedRewards] = useState<string[]>([]);
  const [shuffledShapes, setShuffledShapes] = useState<string[]>([]);

  const startRound = () => {
    const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setTargetShape(target);
    setShuffledShapes([...SHAPES].sort(() => Math.random() - 0.5));
    setMessage('');
  };

  useEffect(() => {
    startRound();
  }, []);

  const handleShapeClick = (shape: string) => {
    if (message === "🎉 Great Job!") return; // Prevent clicking during success delay

    if (shape === targetShape) {
      const newScore = score + 1;
      setScore(newScore);
      setMessage("🎉 Great Job!");
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });

      if (newScore % 5 === 0) {
        const newReward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
        setEarnedRewards(prev => [...prev, newReward]);
      }
      
      setTimeout(startRound, 1000);
    } else {
      setMessage("❌ Try Again!");
      setTimeout(() => {
        setMessage(prev => prev === "❌ Try Again!" ? "" : prev);
      }, 1000);
    }
  };

  const renderShape = (shape: string) => {
    switch(shape) {
      case 'Circle':
        return (
          <motion.div 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#ff6b6b] drop-shadow-md cursor-pointer" 
            onClick={() => handleShapeClick(shape)} 
          />
        );
      case 'Square':
        return (
          <motion.div 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="w-24 h-24 md:w-32 md:h-32 bg-[#4ecdc4] drop-shadow-md rounded-xl cursor-pointer" 
            onClick={() => handleShapeClick(shape)} 
          />
        );
      case 'Rectangle':
        return (
          <motion.div 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="w-32 h-20 md:w-40 md:h-24 bg-[#ffd93d] drop-shadow-md rounded-xl cursor-pointer" 
            onClick={() => handleShapeClick(shape)} 
          />
        );
      case 'Triangle':
        return (
          <motion.div 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="drop-shadow-md cursor-pointer" 
            onClick={() => handleShapeClick(shape)}
          >
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#6c5ce7]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </motion.div>
        );
      case 'Star':
        return (
          <motion.div 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            className="text-[100px] md:text-[140px] text-[#ff9f43] leading-none drop-shadow-md cursor-pointer" 
            onClick={() => handleShapeClick(shape)}
          >
            ★
          </motion.div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-[#87CEEB] to-[#E0F7FF] p-4 md:p-8 rounded-[3rem] shadow-xl flex flex-col items-center relative overflow-hidden shrink-0 h-fit min-h-[600px] border-4 border-sky-300">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 flex-wrap gap-4 bg-white/60 p-5 rounded-3xl shadow-sm border border-sky-100">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-sky-900 drop-shadow-sm mb-1 tracking-wide">🎨 Shape Hunter!</h1>
        
        <div className="flex gap-4 items-center">
          <div className="text-xl md:text-2xl font-bold text-gray-700 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-sky-200">
             Score: <span className="text-[#ff5722]">{score}</span>
          </div>
          {onComplete && (
            <Button 
              variant="outline" 
              className="border-2 border-sky-300 text-sky-700 font-bold hover:bg-sky-100 rounded-xl bg-white shadow-sm"
              onClick={onComplete}
            >
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/80 px-8 py-4 rounded-3xl shadow-sm border-2 border-sky-200 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          Find the <span className="text-[#ff5722]">{targetShape}</span>!
        </h2>
      </div>

      {/* Message */}
      <div className="h-12 mb-6 flex items-center justify-center w-full">
        <p className={`text-2xl md:text-3xl font-bold transition-all ${message.includes('🎉') ? 'text-green-600 scale-110 drop-shadow-sm' : 'text-red-500 animate-bounce'}`}>
          {message}
        </p>
      </div>

      {/* Game Area */}
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 w-full max-w-3xl mb-12">
        <AnimatePresence mode="popLayout">
          {shuffledShapes.map(shape => (
            <motion.div
              key={shape}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex justify-center items-center"
            >
              {renderShape(shape)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Rewards Collection */}
      <div className="w-full flex flex-col items-center mt-auto">
        <h3 className="text-xl font-bold text-sky-800 mb-2">My Stickers</h3>
        <div className="bg-white/50 w-full min-h-[80px] rounded-3xl border-2 border-sky-200 p-4 flex flex-wrap gap-2 justify-center items-center shadow-inner">
          <AnimatePresence>
            {earnedRewards.length === 0 ? (
               <div className="text-sky-600/50 font-bold italic">Score 5 points to earn a sticker!</div>
            ) : (
              earnedRewards.map((reward, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-4xl drop-shadow-md"
                >
                  {reward}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
